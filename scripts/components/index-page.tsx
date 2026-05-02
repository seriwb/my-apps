import type { ResolvedApp } from "../types";
import { Head } from "./head";
import { Card } from "./card";
import { CookieBanner } from "./cookie-banner";
import { PrivacyLink } from "./privacy-link";

interface IndexPageProps {
  apps: ResolvedApp[];
  gaId: string;
}

export function IndexPage({ apps, gaId }: IndexPageProps) {
  return (
    <html lang="ja">
      <Head title="seriwb apps" root="" gaId={gaId} />
      <body>
        <header className="site-header">
          <div className="container">
            <h1 className="site-title">seriwb apps</h1>
            <p className="site-description">作成したアプリの配布ページです。</p>
          </div>
        </header>
        <main className="container">
        <div className="app-grid">
            {apps.map((app) => (
              <Card key={app.def.id} app={app} />
            ))}
          </div>
        </main>
        <CookieBanner gaId={gaId} />
        <footer className="site-footer">
          <div className="container">
            <p>
              © seriwb · <a href="https://github.com/seriwb" target="_blank" rel="noopener">GitHub</a>
              <PrivacyLink root="" gaId={gaId} />
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
