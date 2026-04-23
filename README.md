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

## アプリの追加手順

1. `apps.yml` に以下の形式でエントリを追記する

   ```yaml
   apps:
     - id: my-new-app          # URLに使われるID(英数字・ハイフン)
       name: My New App
       tagline: 一行説明
       description: |
         詳細な説明文。
       icon: assets/icons/my-new-app.png
       screenshots: []         # スクショがあればassets/screenshots/以下のパスを列挙
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

2. アイコン（PNG）を`docs/assets/icons/<id>.png`に配置する
3. `npm run build`で表示を確認してからpushする

---

## 各アプリリポジトリからのリリース集約

### 1. fine-grained PATの発行

GitHubの`Settings → Developer settings → Fine-grained tokens`から、以下の権限を持つトークンを発行します:

- **Repository access**: `seriwb/my-apps`のみ
- **Permissions (Repository)**:
  - Contents: **Read and write**

### 2. Secret の登録

各アプリのプライベートリポジトリの`Settings → Secrets → Actions`に、`HUB_RELEASE_TOKEN`という名前でトークンを登録します。

### 3. release.ymlへの追加

アプリ側のrelease.ymlの末尾（ビルド完了後）に以下を追加します:

```yaml
      - name: my-apps Releasesにアセットを転送
        uses: softprops/action-gh-release@v2
        with:
          repository: seriwb/my-apps
          token: ${{ secrets.HUB_RELEASE_TOKEN }}
          tag_name: <app-id>-v${{ github.ref_name }}
          name: <App Name> ${{ github.ref_name }}
          files: |
            <ビルド成果物のパス>/**/*.dmg
            <ビルド成果物のパス>/**/*.exe
            <ビルド成果物のパス>/**/*.AppImage

      - name: my-apps のサイト再ビルドをトリガー
        run: |
          gh api -X POST repos/seriwb/my-apps/dispatches \
            -f event_type=app-released \
            -f client_payload[app_id]=<app-id>
        env:
          GH_TOKEN: ${{ secrets.HUB_RELEASE_TOKEN }}
```

`<app-id>`は`apps.yml`に書いた`id`と一致させてください。

---

## GitHub Pages の有効化

1. このリポジトリの Settings → Pages を開く
2. **Source** を "GitHub Actions" に設定する
3. main に push すると `deploy.yml` が走り、自動デプロイされる

公開 URL: `https://seriwb.github.io/my-apps/`
