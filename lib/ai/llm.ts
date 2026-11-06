/**
 * OpenAI 兼容协议的 LLM 流式调用封装（DeepSeek / MiMo 等）。
 * 输出统一为本项目前端约定的 SSE 格式：
 *   data: {"delta":{"text":"..."}}
 *   data: [DONE]
 *
 * 内网代理说明：Node 的全局 fetch 不读 http_proxy/https_proxy 环境变量，
 * 这里用 undici ProxyAgent 显式走代理；代理 URL 缺协议前缀时自动补 http://，
 * socks 协议不支持则退回直连。
 */
import { fetch as undiciFetch, ProxyAgent, type Dispatcher } from 'undici';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export function resolveProvider() {
  const provider = (process.env.AI_PROVIDER || 'deepseek').toLowerCase();
  if (provider === 'mimo') {
    return {
      apiKey: process.env.MIMO_API_KEY || '',
      baseUrl: process.env.MIMO_BASE_URL || '',
      model: process.env.MIMO_MODEL || '',
    };
  }
  return {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-chat',
  };
}

/** 目标主机是否命中 no_proxy */
function isNoProxyHost(host: string): boolean {
  const list = (process.env.no_proxy || process.env.NO_PROXY || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.some((item) => host === item || host.endsWith('.' + item) || host.endsWith(item));
}

/** 规范化代理 URL：补协议、丢弃不支持的 socks */
function normalizeProxyUrl(raw: string): string | null {
  let url = raw.trim();
  if (!url) return null;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(url)) url = 'http://' + url; // 缺前缀自动补
  try {
    const parsed = new URL(url);
    if (parsed.protocol.startsWith('socks')) return null; // undici 不支持 socks，退回直连
    return parsed.toString();
  } catch {
    return null; // 无法解析的代理变量，忽略而不是让进程崩溃
  }
}

let cachedDispatcher: Dispatcher | undefined | null = null;
function getProxyDispatcher(targetUrl: string): Dispatcher | undefined {
  if (cachedDispatcher !== null) return cachedDispatcher ?? undefined;
  let dispatcher: Dispatcher | undefined;
  try {
    const target = new URL(targetUrl);
    if (!isNoProxyHost(target.hostname)) {
      const raw =
        (target.protocol === 'http:'
          ? process.env.http_proxy || process.env.HTTP_PROXY
          : process.env.https_proxy || process.env.HTTPS_PROXY) || '';
      const proxyUrl = normalizeProxyUrl(raw);
      if (proxyUrl) {
        dispatcher = new ProxyAgent({ uri: proxyUrl });
      }
    }
  } catch {
    dispatcher = undefined;
  }
  cachedDispatcher = dispatcher ?? null;
  return dispatcher;
}

/**
 * 调用上游 chat/completions(stream) 并转换为本项目的 SSE 格式。
 * 上游缺 Key / 报错时，流式返回一条可读的错误提示，前端能直接显示。
 */
export async function streamChatToProjectSSE(messages: ChatMessage[]): Promise<Response> {
  const { apiKey, baseUrl, model } = resolveProvider();

  const encoder = new TextEncoder();

  const emit = (text: string) =>
    encoder.encode(`data: ${JSON.stringify({ delta: { text } })}\n\n`);
  const done = () => encoder.encode('data: [DONE]\n\n');

  const sse = (enqueue: (chunk: Uint8Array) => void, text: string, withDone = true) => {
    enqueue(emit(text));
    if (withDone) enqueue(done());
  };

  if (!apiKey || apiKey.startsWith('your-')) {
    const hint =
      '未配置 API Key：请在 .env.local 中填写 DEEPSEEK_API_KEY（DeepSeek 开放平台 https://platform.deepseek.com 申请），保存后重启 npm run dev。排盘功能不受影响。';
    const stream = new ReadableStream({
      start(controller) {
        sse((c) => controller.enqueue(c), hint);
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
    });
  }

  const dispatcher = getProxyDispatcher(`${baseUrl}/chat/completions`);

  let upstream: Response;
  try {
    upstream = (await undiciFetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, stream: true, temperature: 0.7 }),
      dispatcher,
    })) as unknown as Response;
  } catch {
    const stream = new ReadableStream({
      start(controller) {
        sse((c) => controller.enqueue(c), `无法连接模型服务（${baseUrl}），请检查网络/代理。`);
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
    });
  }

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => '');
    const stream = new ReadableStream({
      start(controller) {
        sse(
          (c) => controller.enqueue(c),
          `模型服务返回错误（HTTP ${upstream.status}）${errText.slice(0, 200)}`
        );
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
    });
  }

  // 转换上游 OpenAI 格式: data: {"choices":[{"delta":{"content":"..."}}]}
  const upstreamReader = (upstream.body as ReadableStream<Uint8Array>).getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const stream = new ReadableStream({
    async pull(controller) {
      const { done: finished, value } = await upstreamReader.read();
      if (finished) {
        controller.enqueue(done());
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const rawLine of lines) {
        const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') continue; // 统一在流结束时由本端补发
        try {
          const content = JSON.parse(data).choices?.[0]?.delta?.content;
          if (content) controller.enqueue(emit(content));
        } catch {
          // 忽略无法解析的行（keep-alive 等）
        }
      }
    },
    cancel() {
      upstreamReader.cancel();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
