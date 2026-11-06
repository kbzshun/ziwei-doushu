export const metadata = { title: '隐私政策 · 紫微命盘', description: '紫微命盘隐私政策' };

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-[15px] font-semibold mt-8 mb-2" style={{ color: 'var(--tx-0)' }}>{children}</h2>
);

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-0)' }}>
      <header className="glass-nav sticky top-0 z-40">
        <div className="container-page flex h-14 items-center gap-3">
          <a href="/" className="inline-flex items-center gap-1.5 text-[13px] transition-colors hover:text-[color:var(--ac)]"
            style={{ color: 'var(--tx-3)', textDecoration: 'none' }}>
            <span style={{ fontSize: '16px' }}>‹</span>
            <span>返回首页</span>
          </a>
          <div style={{ width: '1px', height: '20px', background: 'var(--bdr-med)' }} />
          <span className="text-[12px]" style={{ color: 'var(--ac)', letterSpacing: '0.2em' }}>紫微命盘</span>
        </div>
      </header>

      <main className="container-page max-w-[800px] py-10" style={{ color: 'var(--tx-2)', lineHeight: 1.85 }}>
        <div className="eyebrow mb-2">LEGAL · PRIVACY</div>
        <h1 className="text-[26px] font-semibold" style={{ color: 'var(--tx-0)' }}>隐私政策</h1>
        <p className="mt-2 mb-8 text-[12px]" style={{ color: 'var(--tx-3)' }}>最后更新：2026年4月</p>

        <div className="card-glass px-4 py-6 sm:px-8 sm:py-8 text-[13px]">
          <H2>1. 我们收集的信息</H2>
          <p>为提供紫微命盘排盘与解读服务，我们可能收集以下信息：</p>
          <ul className="pl-6 list-disc">
            <li><strong style={{ color: 'var(--tx-0)' }}>命盘必要信息</strong>：姓名（选填）、出生公历年月日、出生时辰、性别、出生地经度</li>
            <li><strong style={{ color: 'var(--tx-0)' }}>账号信息（注册后）</strong>：手机号（用于短信验证与会员服务）</li>
            <li><strong style={{ color: 'var(--tx-0)' }}>交互信息</strong>：你在站内的点击、浏览、命盘历史记录</li>
            <li><strong style={{ color: 'var(--tx-0)' }}>反馈信息</strong>：你对解读内容的&quot;准 / 不准&quot;打分与文字反馈</li>
            <li><strong style={{ color: 'var(--tx-0)' }}>支付信息</strong>：购买会员或单项服务时通过第三方支付（支付宝 / 微信支付）处理，本平台不存储完整卡号或密码</li>
          </ul>

          <H2>2. 我们如何使用信息</H2>
          <ul className="pl-6 list-disc">
            <li>命盘信息仅用于本次解读与你账号下的历史命盘记录</li>
            <li>手机号用于注册、登录、订单通知</li>
            <li>反馈信息用于持续改进命理内容质量（脱敏后聚合分析）</li>
            <li>聚合数据可能用于行业研究与平台优化</li>
          </ul>

          <H2>3. 信息共享与第三方</H2>
          <p>除以下情形外，我们不会向第三方共享你的个人信息：</p>
          <ul className="pl-6 list-disc">
            <li>支付服务商（支付宝 / 微信支付）：处理订单结算</li>
            <li>短信服务商（如阿里云短信）：发送验证码</li>
            <li>云服务商（如 Vercel / Cloudflare / 阿里云）：技术承载</li>
            <li>AI 解读服务（如 Anthropic Claude）：处理你的&quot;自由追问&quot;对话（已做匿名化）</li>
            <li>司法机关或政府部门基于法律法规的合法要求</li>
          </ul>

          <H2>4. 信息安全</H2>
          <p>我们采取业界常见的技术与管理手段保护你的信息（HTTPS 传输加密、数据库加密存储、访问权限控制等）。但请注意，互联网传输无法保证 100% 安全。</p>

          <H2>5. 你的权利</H2>
          <ul className="pl-6 list-disc">
            <li><strong style={{ color: 'var(--tx-0)' }}>查询</strong>：可通过账号中心查看你的所有历史命盘与订单</li>
            <li><strong style={{ color: 'var(--tx-0)' }}>删除</strong>：联系客服删除账号下指定命盘 / 注销账号</li>
            <li><strong style={{ color: 'var(--tx-0)' }}>导出</strong>：可申请导出你的全部个人数据</li>
          </ul>

          <H2>6. Cookie 与本地存储</H2>
          <p>本站使用 cookie / localStorage 用于：保存你的暗黑/亮色主题偏好、最近的命盘历史、会员登录状态。你可在浏览器设置中关闭，但部分功能可能受影响。</p>

          <H2>7. 未成年人</H2>
          <p>本平台命理内容面向 18 岁以上成年用户。未成年人请在监护人同意下使用，并不得将解读用于重大人生决策。</p>

          <H2>8. 政策变更</H2>
          <p>本政策可能不定期更新。重大变更将以显著方式通知。继续使用即表示同意更新后的版本。</p>
        </div>

        <p className="mt-10 text-[12px]" style={{ color: 'var(--tx-3)' }}>
          <a href="/terms" className="transition-colors hover:text-[color:var(--ac-hi)]" style={{ color: 'var(--ac)' }}>服务条款</a>
          {' · '}
          <a href="/" className="transition-colors hover:text-[color:var(--ac-hi)]" style={{ color: 'var(--ac)' }}>返回首页</a>
        </p>
      </main>
    </div>
  );
}
