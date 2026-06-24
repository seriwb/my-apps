import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import yaml from "js-yaml";
import type { AppDef, SiteConfig, Release, ResolvedApp, ResolvedReleaseNote } from "./types";
import { IndexPage } from "./components/index-page";
import { AppPage } from "./components/app-page";
import { PrivacyPage } from "./components/privacy-page";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const GA_MEASUREMENT_ID = (process.env.GA_MEASUREMENT_ID ?? "").trim();

// GitHub Releases API 問い合わせ
async function fetchReleases(owner: string, repo: string): Promise<Release[]> {
  const token = process.env.GH_TOKEN;
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `https://api.github.com/repos/${owner}/${repo}/releases?per_page=50`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    console.warn(`GitHub API returned ${res.status} for ${url}`);
    return [];
  }
  return (await res.json()) as Release[];
}

// アプリごとに最新 release と asset URL を解決
function resolveApp(def: AppDef, releases: Release[]): ResolvedApp {
  const filtered = releases
    .filter((r) => r.tag_name.startsWith(def.release_tag_prefix))
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

  const latest = filtered[0];

  const releaseNotes: ResolvedReleaseNote[] = filtered.map((r) => ({
    tag: r.tag_name,
    version: r.tag_name.slice(def.release_tag_prefix.length),
    publishedAt: r.published_at,
    name: r.name,
    body: (r.body ?? "").trim(),
  }));

  if (!latest) {
    return { def, version: "未リリース", publishedAt: null, downloadUrls: {}, releases: releaseNotes };
  }

  const version = latest.tag_name.slice(def.release_tag_prefix.length);
  const downloadUrls: Record<string, string> = {};

  for (const [platform, pattern] of Object.entries(def.asset_patterns)) {
    const asset = latest.assets.find((a) => a.name.includes(pattern));
    if (asset) downloadUrls[platform] = asset.browser_download_url;
  }

  return { def, version, publishedAt: latest.published_at, downloadUrls, releases: releaseNotes };
}

// 出力ヘルパー
function writeDoc(relPath: string, content: string): void {
  const dest = path.join(ROOT, "docs", relPath);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content, "utf-8");
  console.log(`  ✓ docs/${relPath}`);
}

function renderPage(element: ReactNode): string {
  return "<!doctype html>\n" + renderToStaticMarkup(element);
}

// sitemap.xml を生成
function buildSitemap(siteUrl: string, apps: ResolvedApp[], withPrivacy: boolean): string {
  const urls: string[] = [];

  // トップページ
  urls.push(`  <url>\n    <loc>${siteUrl}</loc>\n  </url>`);

  // 各アプリページ（lastmod はリリース日）
  for (const app of apps) {
    const lastmod = app.publishedAt ? `\n    <lastmod>${app.publishedAt.slice(0, 10)}</lastmod>` : "";
    urls.push(`  <url>\n    <loc>${siteUrl}apps/${app.def.id}.html</loc>${lastmod}\n  </url>`);
  }

  // プライバシーページ（GA設定時のみ）
  if (withPrivacy) {
    urls.push(`  <url>\n    <loc>${siteUrl}privacy.html</loc>\n  </url>`);
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

// エントリポイント
async function main(): Promise<void> {
  const configPath = path.join(ROOT, "apps.yml");
  const config = yaml.load(fs.readFileSync(configPath, "utf-8")) as SiteConfig;

  // GitHub Pages の公開URLをowner/repoから導出
  const SITE_URL = `https://${config.owner}.github.io/${config.repo}/`;

  console.log(`🔍 GitHub Releases を取得中 (${config.owner}/${config.repo}) ...`);
  const releases = await fetchReleases(config.owner, config.repo);
  console.log(`   ${releases.length} 件の release を取得しました`);

  const apps = config.apps.map((entry) => {
    const detailPath = path.join(ROOT, "apps", `${entry.id}.yml`);
    const def = yaml.load(fs.readFileSync(detailPath, "utf-8")) as AppDef;
    return resolveApp(def, releases);
  });

  console.log("\n📦 アプリのバージョン:");
  for (const app of apps) {
    const versionLabel = app.version === "未リリース" ? "未リリース" : `v${app.version}`;
    const dateLabel = app.publishedAt ? ` (${app.publishedAt.slice(0, 10)})` : "";
    console.log(`   ${app.def.id}: ${versionLabel}${dateLabel}`);
  }
  console.log(`📊 Google Analytics: ${GA_MEASUREMENT_ID || "未設定 (スニペットを出力しません)"}`);
  console.log(`🌐 サイトURL: ${SITE_URL}`);

  fs.writeFileSync(path.join(ROOT, "docs", ".nojekyll"), "", "utf-8");

  console.log("\n📄 ページを生成中 ...");
  writeDoc("index.html", renderPage(<IndexPage apps={apps} gaId={GA_MEASUREMENT_ID} siteUrl={SITE_URL} />));
  for (const app of apps) {
    writeDoc(
      `apps/${app.def.id}.html`,
      renderPage(<AppPage app={app} owner={config.owner} repo={config.repo} gaId={GA_MEASUREMENT_ID} siteUrl={SITE_URL} />),
    );
  }
  if (GA_MEASUREMENT_ID) {
    writeDoc("privacy.html", renderPage(<PrivacyPage gaId={GA_MEASUREMENT_ID} />));
  }

  console.log("\n🗺️  SEOファイルを生成中 ...");
  writeDoc("sitemap.xml", buildSitemap(SITE_URL, apps, !!GA_MEASUREMENT_ID));
  writeDoc(
    "robots.txt",
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`,
  );

  console.log("\n✅ ビルド完了");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
