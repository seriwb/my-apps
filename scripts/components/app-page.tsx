import type { ResolvedApp } from "../types";
import { formatDate } from "../utils";
import { Head } from "./head";
import { PlatformBadges } from "./platform-badges";
import { DownloadButtons } from "./download-buttons";
import { Notes } from "./notes";
import { ReleaseNotes } from "./release-notes";
import { CookieBanner } from "./cookie-banner";
import { PrivacyLink } from "./privacy-link";

interface AppPageProps {
  app: ResolvedApp;
  owner: string;
  repo: string;
  gaId: string;
  siteUrl: string;
}

/** プラットフォームID（mac/win/linux）をSchema.org向けの表記に変換 */
function platformLabel(p: string): string {
  if (p === "mac") return "macOS";
  if (p === "win") return "Windows";
  if (p === "linux") return "Linux";
  return p;
}

function ScreenshotsSection({ app }: { app: ResolvedApp }) {
  if (app.def.screenshots.length === 0) return null;
  return (
    <section className="app-section">
      <h2 className="section-title" data-en="SCREENSHOTS">スクリーンショット</h2>
      <div className="screenshots">
        {app.def.screenshots.map((s) => (
          <a key={s} href={`../assets/screenshots/${app.def.id}/${s}`} target="_blank" rel="noopener">
            <img src={`../assets/screenshots/${app.def.id}/${s}`} alt={`${app.def.name} screenshot`} />
          </a>
        ))}
      </div>
    </section>
  );
}

export function AppPage({ app, owner, repo, gaId, siteUrl }: AppPageProps) {
  const { def } = app;
  const updated = formatDate(app.publishedAt);
  const title = `${def.name} — seriwb apps`;
  const canonical = `${siteUrl}apps/${def.id}.html`;
  const ogImage = `${siteUrl}${def.icon}`;

  // SoftwareApplication JSON-LD
  const jsonLdBase: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: def.name,
    description: def.tagline,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: def.platforms.map(platformLabel).join(", "),
    image: ogImage,
    url: canonical,
    inLanguage: "ja",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "JPY",
    },
    featureList: def.features,
  };
  if (app.version !== "未リリース") jsonLdBase.softwareVersion = app.version;
  if (app.publishedAt) jsonLdBase.datePublished = app.publishedAt.slice(0, 10);
  const dlUrls = Object.values(app.downloadUrls);
  if (dlUrls.length > 0) jsonLdBase.downloadUrl = dlUrls.length === 1 ? dlUrls[0] : dlUrls;

  return (
    <html lang="ja">
      <Head
        title={title}
        root="../"
        gaId={gaId}
        description={def.tagline}
        canonical={canonical}
        ogType="article"
        ogUrl={canonical}
        ogImage={ogImage}
        jsonLd={jsonLdBase}
      />
      <body>
        <header className="site-header">
          <div className="container">
            <a className="back-link" href="../index.html">← seriwb apps</a>
          </div>
        </header>
        <main className="container">
          <section className="app-hero">
            <img className="app-hero-icon" src={`../${def.icon}`} alt={`${def.name} icon`} width={80} height={80} />
            <div>
              <h1 className="app-hero-title">{def.name}</h1>
              <p className="app-hero-tagline">{def.tagline}</p>
              <div className="app-platforms">
                <PlatformBadges platforms={def.platforms} />
              </div>
            </div>
          </section>
          <section className="app-section">
            <h2 className="section-title" data-en="DOWNLOAD">ダウンロード</h2>
            <div className="download-grid">
              <DownloadButtons app={app} />
            </div>
            <Notes notes={def.notes} downloadUrls={app.downloadUrls} />
          </section>
          <section className="app-section">
            <h2 className="section-title" data-en="ABOUT">説明</h2>
            <p className="app-description">{def.description.trim()}</p>
          </section>
          <section className="app-section">
            <h2 className="section-title" data-en="FEATURES">主な機能</h2>
            <ul className="feature-list">
              {def.features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </section>
          <ScreenshotsSection app={app} />
          <ReleaseNotes owner={owner} repo={repo} releases={app.releases} />
          {updated && <p className="app-updated">{updated}</p>}
        </main>
        <CookieBanner gaId={gaId} />
        <footer className="site-footer">
          <div className="container">
            <p>
              © seriwb · <a href="https://github.com/seriwb" target="_blank" rel="noopener">GitHub</a>
              <PrivacyLink root="../" gaId={gaId} />
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
