import type { ResolvedApp } from "../types";
import { Head } from "./head";
import { Card } from "./card";
import { CookieBanner } from "./cookie-banner";
import { PrivacyLink } from "./privacy-link";

interface IndexPageProps {
  apps: ResolvedApp[];
  gaId: string;
  siteUrl: string;
}

export function IndexPage({ apps, gaId, siteUrl }: IndexPageProps) {
  const title = "seriwb apps";
  const appNames = apps.map((a) => a.def.name).join("・");
  const description = `seriwb が公開するデスクトップアプリ（${appNames}）のダウンロードページ。電脳空間の物理ガジェット配布ページ。`;
  // 代表アイコン（先頭アプリ）をOGP画像に使用
  const ogImage = apps.length > 0 ? `${siteUrl}${apps[0].def.icon}` : undefined;

  // WebSite + ItemList の JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": siteUrl,
        url: siteUrl,
        name: title,
        description: description,
        inLanguage: "ja",
      },
      {
        "@type": "ItemList",
        name: "アプリ一覧",
        itemListElement: apps.map((app, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: app.def.name,
          url: `${siteUrl}apps/${app.def.id}.html`,
        })),
      },
    ],
  };

  return (
    <html lang="ja">
      <Head
        title={title}
        root=""
        gaId={gaId}
        description={description}
        canonical={siteUrl}
        ogType="website"
        ogUrl={siteUrl}
        ogImage={ogImage}
        jsonLd={jsonLd}
      />
      <body>
        <header className="site-header">
          <div className="container">
            <h1 className="site-title">
              seriwb apps<span className="terminal-cursor">_</span>
            </h1>
            <p className="site-description">電脳空間の物理ガジェット配布ページ</p>
            <p className="site-count">[ TOOLS: {apps.length} ]</p>
          </div>
        </header>
        <main className="container">
          <div className="app-shelf">
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
