# seriwb apps

作ったアプリの配布用ページ。

- **ランディングページ**: https://seriwb.github.io/my-apps/
- **バイナリ配布**: このリポジトリの [Releases](../../releases) に集約

---

## ローカル開発

```bash
npm install
npm run build    # docs/以下の静的HTMLを生成
npm run preview  # http://localhost:8080 で確認
```

`GH_TOKEN`環境変数を設定しておくと、GitHub Releases APIのrate limitを回避できます。

---

## Google Analyticsの設定

サイトはGoogle Analytics 4 (GA4) の組み込みに対応しています。設定しない場合はスニペットもCookie同意バナーも出力されません。

### ローカル環境

```bash
cp .env.example .env
# .envを開いてGA_MEASUREMENT_ID=G-XXXXXXXXXXを設定
npm run build
```

### GitHub Actions（本番）

リポジトリの`Settings → Secrets and variables → Actions`に以下を登録します。

| Secret 名           | 値                                  |
| ------------------- | ----------------------------------- |
| `GA_MEASUREMENT_ID` | `G-XXXXXXXXXX`（GA4のプロパティID） |

`push`または`workflow_dispatch`で`deploy.yml`が実行されると、ビルド時にスニペットが埋め込まれます。

### 計測内容

| 計測項目     | GA4 イベント        | パラメータ                          |
| ------------ | ------------------- | ----------------------------------- |
| ページ表示   | `page_view`（自動） | —                                   |
| ダウンロード | `download`          | `app_id`, `app_version`, `platform` |

### Cookie同意バナー

GA4は**Google Consent Mode v2 + オプトイン型**で実装されています。

- 初回訪問時にページ下部にバナーを表示
- 「同意する」を押すまでクッキーを設定せず、匿名のcookieless pingのみ送信
- 「拒否する」を押すと計測しない（ページをまたいで記憶）
- フッターの「プライバシー設定」リンクから選択を変更可能
- 選択は`localStorage`の`ga_consent`キーに保存

---

## ファイル構成

```
my-apps/
├── apps.yml                      # アプリID一覧（順序の管理のみ）
├── apps/
│   └── <id>.yml                  # 各アプリのメタデータ（アプリ側から自動転送）
├── docs/
│   └── assets/
│       ├── icons/<id>.png        # アイコン画像
│       └── screenshots/<id>/    # スクリーンショット画像
└── scripts/
    └── build-site.mts            # apps.yml + apps/<id>.yml を読んでHTMLを生成
```

アプリのメタデータ（機能説明・tagline・notesなど）の**一次情報源は各アプリリポジトリ**の`.app-meta.yml`です。`apps/<id>.yml`はリリース時に自動転送されるコピーであり、直接編集しないでください。

スクリーンショット画像の**一次情報源も各アプリリポジトリ**の`docs/screenshots/`ディレクトリです。`docs/assets/screenshots/<id>/`はリリース時に自動転送されるコピーです。

---

## アプリの追加手順

### 1. `apps.yml` にIDを追記する

```yaml
apps:
  - id: my-new-app    # URLに使われるID（英小文字・数字・ハイフン）
```

### 2. `apps/my-new-app.yml` を初期作成する

```yaml
id: my-new-app
name: My New App
tagline: 一行説明
description: |
  詳細な説明文。
icon: assets/icons/my-new-app.png
screenshots: []         # スクショがあればassets/screenshots/<id>/以下のパスを列挙
features:
  - 機能1
  - 機能2
platforms: [mac, win, linux]
release_tag_prefix: my-new-app-v
asset_patterns:
  mac: ".dmg"
  win: "-Setup-"
  linux: ".AppImage"
```

以降はアプリ側の `.app-meta.yml` を編集してリリースすると自動的にこのファイルが上書きされます。

### 3. アイコンと初期画像を配置する

- アイコン（PNG）: `docs/assets/icons/<id>.png`（my-apps 側で管理）
- スクリーンショット（初期）: `docs/assets/screenshots/<id>/<n>.png`（以降はアプリ側 `docs/screenshots/` からリリース時に自動転送）

### 4. 動作確認してpushする

```bash
npm run build
```

---

## 各アプリリポジトリとの連携セットアップ

### 1. fine-grained PATの発行

GitHubの`Settings → Developer settings → Fine-grained tokens`から、以下の権限を持つトークンを発行します:

- **Repository access**: `seriwb/my-apps`のみ
- **Permissions (Repository)**:
  - Contents: **Read and write**

### 2. Secret の登録

各アプリのリポジトリの`Settings → Secrets → Actions`に、`HUB_RELEASE_TOKEN`という名前でトークンを登録します。

### 3. アプリ側リポジトリに `.app-meta.yml` を作成する

アプリの機能説明・メタデータを記述します（上記の `apps/<id>.yml` と同一スキーマ）。

### 4. アプリ側の `release.yml` に転送ステップを追加する

ビルド完了後の `transfer` ジョブに以下を追加します:

```yaml
  transfer:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # ... リリースアセットのダウンロード・転送ステップ ...

      - name: my-apps Releasesにアセットを転送
        uses: softprops/action-gh-release@v3
        with:
          repository: seriwb/my-apps
          token: ${{ secrets.HUB_RELEASE_TOKEN }}
          tag_name: <app-id>-${{ github.ref_name }}
          name: <App Name> ${{ github.ref_name }}
          files: dist-app/*

      - name: my-appsへメタデータ・スクリーンショットを転送し、再ビルドをディスパッチ
        run: |
          META_CONTENT=$(base64 -w 0 .app-meta.yml)
          HAS_SCREENSHOTS="false"
          if [ -d docs/screenshots ] && [ "$(ls -A docs/screenshots)" ]; then
            HAS_SCREENSHOTS="true"
          fi
          gh api -X POST repos/seriwb/my-apps/dispatches \
            -f event_type=app-meta-updated \
            -f client_payload[app_id]=<app-id> \
            -f client_payload[meta_b64]="$META_CONTENT" \
            -f client_payload[has_screenshots]="$HAS_SCREENSHOTS" \
            -f client_payload[src_repo]=seriwb/<app-repo> \
            -f client_payload[src_tag]="${{ github.ref_name }}"
        env:
          GH_TOKEN: ${{ secrets.HUB_RELEASE_TOKEN }}
```

dispatch を受けた `update-app-meta.yml` が以下を行います:

1. `apps/<id>.yml` を更新
2. `has_screenshots=true` の場合、アプリリポジトリの `docs/screenshots/` をスパースクローンし `docs/assets/screenshots/<id>/` へコピー
3. git commit & push → `deploy.yml` が自動起動してサイトを再ビルド

---

## GitHub Pages の有効化

1. このリポジトリの Settings → Pages を開く
2. **Source** を "GitHub Actions" に設定する
3. main に push すると `deploy.yml` が走り、自動デプロイされる

公開 URL: `https://seriwb.github.io/my-apps/`
