import { Head } from "./head";

const PRIVACY_SCRIPT = `(function () {
  var status = document.getElementById('privacy-status');
  var saved = document.getElementById('privacy-saved');
  var savedTimer = null;

  function updateStatus() {
    var val = localStorage.getItem('ga_consent');
    if (val === 'granted') {
      status.textContent = '現在、計測を許可しています。';
      status.style.color = 'var(--accent)';
    } else if (val === 'denied') {
      status.textContent = '現在、計測を拒否しています。';
      status.style.color = 'var(--text-muted)';
    } else {
      status.textContent = '未設定（計測は行われていません）。';
      status.style.color = 'var(--text-muted)';
    }
  }

  updateStatus();

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-consent]');
    if (!btn) return;
    updateStatus();
    clearTimeout(savedTimer);
    saved.style.display = 'block';
    savedTimer = setTimeout(function () { saved.style.display = 'none'; }, 3000);
  });
})();`;

export function PrivacyPage({ gaId }: { gaId: string }) {
  return (
    <html lang="ja">
      <Head title="プライバシー設定 — seriwb apps" root="" gaId={gaId} />
      <body>
        <header className="site-header">
          <div className="container">
            <a className="back-link" href="index.html">← seriwb apps</a>
          </div>
        </header>
        <main className="container">
          <section className="app-section">
            <h1 className="app-hero-title" style={{ marginBottom: "8px" }}>プライバシー設定</h1>
            <p style={{ color: "var(--text-muted)" }}>Google Analyticsによるアクセス計測の許可・拒否を設定できます。</p>
          </section>
          <section className="app-section">
            <h2 className="section-title">収集する情報</h2>
            <ul className="feature-list">
              <li>ページの表示回数</li>
              <li>アプリのダウンロード数（アプリ名・バージョン・OS別）</li>
            </ul>
            <p style={{ marginTop: "12px", fontSize: "13px", color: "var(--text-muted)" }}>
              収集したデータはGoogle Analyticsに送信されます。IPアドレスは匿名化されます。Cookieは「許可する」を選択した場合のみ設定されます。
            </p>
          </section>
          <section className="app-section">
            <h2 className="section-title">現在の設定</h2>
            <p id="privacy-status" style={{ marginBottom: "16px", fontWeight: 500 }}></p>
            <div className="download-grid">
              <button type="button" className="btn-primary" data-consent="granted">計測を許可する</button>
              <button type="button" className="btn-secondary" data-consent="denied">計測を拒否する</button>
            </div>
            <p id="privacy-saved" style={{ display: "none", marginTop: "12px", color: "var(--accent)", fontSize: "13px" }}>設定を保存しました。</p>
          </section>
        </main>
        <footer className="site-footer">
          <div className="container">
            <p>© seriwb · <a href="https://github.com/seriwb" target="_blank" rel="noopener">GitHub</a></p>
          </div>
        </footer>
        <script dangerouslySetInnerHTML={{ __html: PRIVACY_SCRIPT }} />
      </body>
    </html>
  );
}
