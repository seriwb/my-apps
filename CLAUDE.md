# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## アプローチ
- **日本語でコメントすること**
- 行動の前に思考せよ。コードを書く前に既存のファイルを読み込め。(Think before acting. Read existing files before writing code.)
- 出力は簡潔に、推論は徹底的に行え。(Be concise in output but thorough in reasoning.)
- ファイル全体の書き換えよりも、部分的な編集を優先せよ。(Prefer editing over rewriting whole files.)
- 変更の可能性がある場合を除き、既読のファイルを再読するな。(Do not re-read files you have already read unless the file may have changed.)
- 完了を宣言する前にコードをテストせよ。(Test your code before declaring done.)
- おべっか的な前置きや結びの無駄話は不要。(No sycophantic openers or closing fluff.)
- 解決策は単純かつ直接的に保て。(Keep solutions simple and direct.)
- ユーザーの指示は常にこのファイルの内容に優先する。(User instructions always override this file.)

## Coding Rules
- package追加の際は固定バージョンにすること(^1.0.1ではなく1.0.1とすること)
- 文字コードはUTF-8
- 日本語と英語の間に半角スペースを挟まない（OK:新しいSample Pageを確認 / NG:新しい Sample Page を確認）

## コマンド

```bash
pnpm install         # 依存関係のインストール
pnpm run build       # docs/ 以下の静的 HTML を生成
pnpm run preview     # http://localhost:8080 でビルド結果を確認（python3 http.server）
```

`GH_TOKEN` 環境変数を設定しておくと、`pnpm run build` 中の GitHub Releases API レートリミットを回避できる。
`GA_MEASUREMENT_ID` 環境変数（形式: `G-XXXXXXXXXX`）を設定するとGA4スニペットと Cookie 同意バナーが生成される。未設定時はどちらも出力されない。  
ローカルでは `.env` ファイルに記載（`.env.example` 参照）。

テスト・Lint コマンドはない。TypeScript は `tsx` が直接実行するため、`tsconfig.json` は型チェック用設定（`noEmit: true`）。

## アーキテクチャ

このリポジトリは、GitHub Pages 向けの静的ランディングページ (`https://seriwb.github.io/my-apps/`) を生成する。

### ビルドの流れ

1. `apps.yml` — アプリの表示順序を管理するリスト（`owner`/`repo` も定義）
2. `apps/<id>.yml` — 各アプリのメタデータ（後述の注意事項あり）
3. `scripts/build-site.mts` — 上記を読み込み、GitHub Releases API からリリース情報を取得し、`templates/` のテンプレートを `{{VAR}}.replaceAll` で置換して `docs/` へ出力
4. `docs/` — GitHub Pages がサービングする静的ファイル群（`.nojekyll` はビルド時に自動生成）

### テンプレートエンジン

`render()` 関数は単純な `replaceAll("{{KEY}}", value)` のみ。専用エンジンではないため、テンプレートファイル内に `{{` `}}` を含む HTML リテラルを書くとビルドが壊れる。変数名は重複させないこと。

## 重要：ファイルの一次情報源

| ファイル | 一次情報源 | このリポジトリでの扱い |
|---|---|---|
| `apps/<id>.yml` | 各アプリリポジトリの `.app-meta.yml` | **直接編集禁止** |
| `docs/assets/screenshots/<id>/` | 各アプリリポジトリの `docs/screenshots/` | **直接編集禁止** |
| `docs/assets/icons/<id>.png` | このリポジトリ | 手動管理 |
| `apps.yml` | このリポジトリ | 手動管理（表示順のみ） |

`apps/<id>.yml` と `docs/assets/screenshots/<id>/` は、各アプリリポジトリがリリース時に `app-meta-updated` dispatch を送信し、`.github/workflows/update-app-meta.yml` が自動的に上書きする。直接編集しても次のリリース時に消える。

メタデータを変更する場合は、対応するアプリリポジトリの `.app-meta.yml` を編集してリリースすること。

## 新しいアプリの追加

詳細手順は `README.md` を参照。要点:

1. `apps.yml` に `- id: <new-id>` を追記（表示順に挿入）
2. `apps/<new-id>.yml` を初期作成（以降はアプリ側からの自動転送に移行）
3. アイコン `docs/assets/icons/<new-id>.png` を配置
4. `pnpm run build` で確認後 push

`app_id` に使える文字は英小文字・数字・ハイフンのみ（先頭は英小文字か数字）。`update-app-meta.yml` の検証正規表現: `^[a-z0-9][a-z0-9-]*$`
