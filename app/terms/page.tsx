export const metadata = { title: '服务条款 · 紫微命盘', description: '紫微命盘服务条款与用户协议' };

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-[15px] font-semibold mt-8 mb-2" style={{ color: 'var(--tx-0)' }}>{children}</h2>
);

export default function TermsPage() {
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
        <div className="eyebrow mb-2">LEGAL · TERMS</div>
        <h1 className="text-[26px] font-semibold" style={{ color: 'var(--tx-0)' }}>服务条款</h1>
        <p className="mt-2 mb-8 text-[12px]" style={{ color: 'var(--tx-3)' }}>最后更新：2026年4月</p>

        <div className="card-glass px-4 py-6 sm:px-8 sm:py-8 text-[13px]">
          <H2>1. 服务概述</H2>
          <p>紫微命盘（以下简称&quot;本平台&quot;）基于倪海厦《天纪》紫微斗数体系提供命盘排盘与解读服务。本平台所有命理内容仅供参考，<strong style={{ color: 'var(--tx-0)' }}>不构成任何医疗、投资、法律、心理咨询或人生重大决策建议</strong>。</p>

          <H2>2. 用户行为规范</H2>
          <p>使用本平台即表示您同意：</p>
          <ul className="pl-6 list-disc">
            <li>仅出于合法、个人参考目的使用本平台</li>
            <li>不传播本平台内容用于商业销售、转载或公开发布</li>
            <li>不进行扰乱平台正常运行的行为</li>
            <li>提交的出生信息真实有效；本平台对错误信息导致的解读偏差不承担责任</li>
          </ul>

          <H2>3. 知识产权与禁止条款 · 反爬反训练</H2>
          <p className="card-inner px-4 py-4" style={{ borderLeft: '3px solid var(--ji)' }}>
            <strong style={{ color: 'var(--tx-0)' }}>本平台所有命理内容、知识库（含 14 主星 × 12 宫 × 男女 × 四化 × 大限流年的全部解读文本）、UI 设计、算法整合方案、案例库均为本平台原创或经合法整理。</strong><br /><br />
            严格禁止以下行为，违者保留追究民事赔偿与刑事责任的权利：<br />
            ① 通过爬虫、自动化脚本、批量调用 API 等任何技术手段抓取本平台内容；<br />
            ② 将本平台生成的命盘解读、文本、API 响应数据**用于训练任何机器学习模型**（含但不限于大语言模型、命理生成模型、文本生成模型等）；<br />
            ③ 将本平台生成的内容转售、发布到其他网站、APP、自媒体账号；<br />
            ④ 反编译、复制、修改本平台前端或后端代码并以&quot;自营&quot;方式提供同类服务。<br /><br />
            本平台输出文本嵌入有指纹追溯水印，违规复制 / 训练所产生的输出可被检测追溯。一经发现违规，本平台有权要求 <strong style={{ color: 'var(--tx-0)' }}>每例违约赔偿 100 万元人民币</strong>，并保留向法院提起诉讼及配合公安机关调查的权利。
          </p>

          <H2>4. 免责声明</H2>
          <p>本平台命理内容基于传统紫微斗数与倪海厦体系的知识整理，<strong style={{ color: 'var(--tx-0)' }}>不保证 100% 准确</strong>。命运受天、地、人三才共同影响，本平台输出仅作为认识自我的参考，使用者应理性看待，不应过度依赖任何单一命理判断。</p>
          <p>因使用本平台内容产生的任何后果（包括但不限于决策失误、心理影响、关系变化等），本平台不承担法律责任。</p>

          <H2>5. 服务变更与终止</H2>
          <p>本平台保留随时调整、暂停或终止部分或全部服务的权利。重大变更将以站内公告或邮件方式通知用户。</p>

          <H2>6. 法律适用与争议解决</H2>
          <p>本条款适用中华人民共和国法律。若发生争议，双方应友好协商；协商不成的，提交本平台运营主体所在地有管辖权的人民法院诉讼解决。</p>

          <H2>7. 联系方式</H2>
          <p>如有疑问，请通过本平台公布的客服微信 / 邮箱联系。</p>
        </div>

        <p className="mt-10 text-[12px]" style={{ color: 'var(--tx-3)' }}>
          <a href="/privacy" className="transition-colors hover:text-[color:var(--ac-hi)]" style={{ color: 'var(--ac)' }}>隐私政策</a>
          {' · '}
          <a href="/" className="transition-colors hover:text-[color:var(--ac-hi)]" style={{ color: 'var(--ac)' }}>返回首页</a>
        </p>
      </main>
    </div>
  );
}
