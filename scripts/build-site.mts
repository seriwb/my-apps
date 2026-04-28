import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const GA_MEASUREMENT_ID = (process.env.GA_MEASUREMENT_ID ?? "").trim();

// ---- 型定義 ----
interface AssetPatterns {
  mac?: string;
  win?: string;
  linux?: string;
}

interface AppNotes {
  mac?: string;
  win?: string;
  linux?: string;
}

interface AppDef {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  screenshots: string[];
  features: string[];
  platforms: string[];
  release_tag_prefix: string;
  asset_patterns: AssetPatterns;
  notes?: AppNotes;
}

interface AppEntry {
  id: string;
}

interface SiteConfig {
  owner: string;
  repo: string;
  apps: AppEntry[];
}

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
}

interface Release {
  tag_name: string;
  published_at: string;
  assets: ReleaseAsset[];
}

interface ResolvedApp {
  def: AppDef;
  version: string;
  publishedAt: string | null;
  downloadUrls: Record<string, string>;
}

// ---- HTML エスケープ ----
function esc(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ---- GitHub Releases API 問い合わせ ----
async function fetchReleases(owner: string, repo: string): Promise<Release[]> {
  const token = process.env.GH_TOKEN;
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const url = `https://api.github.com/repos/${owner}/${repo}/releases?per_page=50`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    console.warn(`GitHub API returned ${res.status} for ${url}`);
    return [];
  }
  return (await res.json()) as Release[];
}

// ---- アプリごとに最新 release と asset URL を解決 ----
function resolveApp(def: AppDef, releases: Release[]): ResolvedApp {
  const latest = releases
    .filter((r) => r.tag_name.startsWith(def.release_tag_prefix))
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())[0];

  if (!latest) {
    return { def, version: "未リリース", publishedAt: null, downloadUrls: {} };
  }

  const version = latest.tag_name.slice(def.release_tag_prefix.length);
  const downloadUrls: Record<string, string> = {};

  for (const [platform, pattern] of Object.entries(def.asset_patterns)) {
    const asset = latest.assets.find((a) => a.name.includes(pattern));
    if (asset) downloadUrls[platform] = asset.browser_download_url;
  }

  return { def, version, publishedAt: latest.published_at, downloadUrls };
}

// ---- テンプレートのシンプルな置換エンジン ----
function render(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

// ---- プラットフォームバッジ生成 ----
const PLATFORM_LABEL: Record<string, string> = {
  mac: "macOS",
  win: "Windows",
  linux: "Linux",
};

function platformBadges(platforms: string[]): string {
  return platforms.map((p) => `<span class="badge badge-${p}">${esc(PLATFORM_LABEL[p] ?? p)}</span>`).join("\n    ");
}

// ---- ダウンロードボタン生成 ----
function downloadButtons(app: ResolvedApp): string {
  const { def, version, downloadUrls } = app;

  return def.platforms
    .map((p) => {
      const url = downloadUrls[p];
      const label = PLATFORM_LABEL[p] ?? p;
      if (url) {
        return `<a class="btn-primary" href="${esc(url)}" download data-ga-event="download" data-ga-app-id="${esc(def.id)}" data-ga-app-version="${esc(version)}" data-ga-platform="${esc(p)}">${esc(label)}${p === "mac" ? " (arm64)" : ""} <span style="font-size:12px;opacity:0.8;">v${esc(version)}</span>\n        </a>`;
      } else {
        return `<span class="btn-primary disabled">${esc(label)} — 未リリース</span>`;
      }
    })
    .join("\n        ");
}

// ---- OS 別注意書き生成 ----
function notesSection(notes: AppNotes | undefined, downloadUrls: Record<string, string>): string {
  if (!notes) return "";
  const lines: string[] = [];
  for (const [platform, note] of Object.entries(notes)) {
    if (note && downloadUrls[platform]) {
      lines.push(esc(note.trim()));
    }
  }
  if (lines.length === 0) return "";
  return `<div class="note-box">${lines.join("<br/><br/>")}</div>`;
}

// ---- 最終更新日のフォーマット ----
function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `最終更新: ${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

// ---- ファイル読み込みヘルパー ----
function readTemplate(name: string): string {
  return fs.readFileSync(path.join(ROOT, "templates", name), "utf-8");
}

function readPartial(name: string): string {
  return fs.readFileSync(path.join(ROOT, "templates", "partials", name), "utf-8");
}

// ---- 出力ヘルパー ----
function writeDoc(relPath: string, content: string): void {
  const dest = path.join(ROOT, "docs", relPath);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content, "utf-8");
  console.log(`  ✓ docs/${relPath}`);
}

// ---- Google Analytics スニペット生成（Consent Mode v2） ----
function gaSnippet(): string {
  if (!GA_MEASUREMENT_ID) return "";
  const id = esc(GA_MEASUREMENT_ID);
  return `<!-- Google tag (gtag.js) -->
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied' });
  (function () {
    if (localStorage.getItem('ga_consent') === 'granted') {
      gtag('consent', 'update', { analytics_storage: 'granted' });
    }
  })();
</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
<script>
  gtag('js', new Date());
  gtag('config', '${id}');
  document.addEventListener('click', function (e) {
    var dl = e.target.closest && e.target.closest('[data-ga-event="download"]');
    if (dl) {
      gtag('event', 'download', {
        app_id: dl.dataset.gaAppId,
        app_version: dl.dataset.gaAppVersion,
        platform: dl.dataset.gaPlatform,
      });
    }
  });
</script>
<script>
  (function () {
    var CONSENT_KEY = 'ga_consent';
    function showBanner() {
      var el = document.getElementById('cookie-consent');
      if (el) el.hidden = false;
    }
    function hideBanner() {
      var el = document.getElementById('cookie-consent');
      if (el) el.hidden = true;
    }
    if (!localStorage.getItem(CONSENT_KEY)) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showBanner);
      } else {
        showBanner();
      }
    }
    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('[data-consent]');
      if (btn) {
        var choice = btn.getAttribute('data-consent');
        localStorage.setItem(CONSENT_KEY, choice);
        if (typeof gtag !== 'undefined') {
          gtag('consent', 'update', {
            analytics_storage: choice === 'granted' ? 'granted' : 'denied',
          });
        }
        hideBanner();
        return;
      }
      var reset = e.target.closest && e.target.closest('[data-consent-reset]');
      if (reset) {
        e.preventDefault();
        localStorage.removeItem(CONSENT_KEY);
        showBanner();
      }
    });
  })();
</script>`;
}

// ---- Cookie 同意バナー生成 ----
function cookieBanner(): string {
  if (!GA_MEASUREMENT_ID) return "";
  return `<div id="cookie-consent" class="cookie-consent" hidden>
  <p class="cookie-consent-text">このサイトでは Google Analytics を使ってアクセス状況を計測しています。許可いただける場合は「同意する」を押してください。</p>
  <div class="cookie-consent-actions">
    <button type="button" data-consent="denied">拒否する</button>
    <button type="button" data-consent="granted">同意する</button>
  </div>
</div>`;
}

// ---- プライバシー設定リンク生成 ----
function privacyLink(root: string): string {
  if (!GA_MEASUREMENT_ID) return "";
  return ` · <a href="${root}privacy.html">プライバシー設定</a>`;
}

// ---- index.html 生成 ----
function buildIndex(apps: ResolvedApp[]): void {
  const headTpl = readPartial("head.html");
  const cardTpl = readPartial("card.html");
  const indexTpl = readTemplate("index.html");

  const cards = apps
    .map((app) => {
      const { def, version } = app;
      const cardHtml = render(cardTpl, {
        ROOT: "",
        ID: esc(def.id),
        NAME: esc(def.name),
        TAGLINE: esc(def.tagline),
        ICON: esc(def.icon),
        PLATFORM_BADGES: platformBadges(def.platforms),
        VERSION: version === "未リリース" ? version : `${esc(version)}`,
      });
      return cardHtml;
    })
    .join("\n");

  const headHtml = render(headTpl, { TITLE: "seriwb apps", ROOT: "", GA_SNIPPET: gaSnippet() });
  const html = render(indexTpl, {
    HEAD: headHtml,
    CARDS: cards,
    COOKIE_BANNER: cookieBanner(),
    PRIVACY_LINK: privacyLink(""),
  });
  writeDoc("index.html", html);
}

// ---- アプリ詳細ページ生成 ----
function buildAppPage(app: ResolvedApp): void {
  const headTpl = readPartial("head.html");
  const appTpl = readTemplate("app.html");
  const { def } = app;

  const features = def.features.map((f) => `<li>${esc(f)}</li>`).join("\n        ");

  const screenshotsSection =
    def.screenshots.length > 0
      ? `<section class="app-section">
        <h2 class="section-title">スクリーンショット</h2>
        <div class="screenshots">
          ${def.screenshots.map((s) => `<a href="../assets/screenshots/${esc(def.id)}/${esc(s)}" target="_blank" rel="noopener"><img src="../assets/screenshots/${esc(def.id)}/${esc(s)}" alt="${esc(def.name)} screenshot" /></a>`).join("\n          ")}
        </div>
      </section>`
      : "";

  const headHtml = render(headTpl, { TITLE: `${def.name} — seriwb apps`, ROOT: "../", GA_SNIPPET: gaSnippet() });

  const html = render(appTpl, {
    HEAD: headHtml,
    ROOT: "../",
    ID: esc(def.id),
    NAME: esc(def.name),
    TAGLINE: esc(def.tagline),
    ICON: esc(def.icon),
    DESCRIPTION: esc(def.description.trim()),
    PLATFORM_BADGES: platformBadges(def.platforms),
    DOWNLOAD_BUTTONS: downloadButtons(app),
    NOTES: notesSection(def.notes, app.downloadUrls),
    FEATURES: features,
    SCREENSHOTS_SECTION: screenshotsSection,
    UPDATED: esc(formatDate(app.publishedAt)),
    COOKIE_BANNER: cookieBanner(),
    PRIVACY_LINK: privacyLink("../"),
  });
  writeDoc(`apps/${def.id}.html`, html);
}

// ---- プライバシー設定ページ生成 ----
function buildPrivacyPage(): void {
  const headTpl = readPartial("head.html");
  const privacyTpl = readTemplate("privacy.html");
  const headHtml = render(headTpl, { TITLE: "プライバシー設定 — seriwb apps", ROOT: "", GA_SNIPPET: gaSnippet() });
  const html = render(privacyTpl, { HEAD: headHtml, ROOT: "" });
  writeDoc("privacy.html", html);
}

// ---- エントリポイント ----
async function main(): Promise<void> {
  const configPath = path.join(ROOT, "apps.yml");
  const config = yaml.load(fs.readFileSync(configPath, "utf-8")) as SiteConfig;

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

  // .nojekyll を保証
  fs.writeFileSync(path.join(ROOT, "docs", ".nojekyll"), "", "utf-8");

  console.log("\n📄 ページを生成中 ...");
  buildIndex(apps);
  for (const app of apps) {
    buildAppPage(app);
  }
  if (GA_MEASUREMENT_ID) buildPrivacyPage();

  console.log("\n✅ ビルド完了");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
