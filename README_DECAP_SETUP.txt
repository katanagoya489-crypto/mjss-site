# MJSS Decap CMS 導入セット

## これでできること
- `/admin/` から管理画面に入る
- 次回参加者、過去参加者、クリエイターをフォーム感覚で編集する
- 画像をアップロードして表示する
- JSONデータを書き換えるだけで各ページへ反映する

## 最初にやること
1. この一式を GitHub リポジトリ `mjss-site` に上書きアップロード
2. `admin/config.yml` の `REPLACE_WITH_YOUR_GITHUB_NAME` を自分の GitHub ユーザー名に変更
3. GitHub に push
4. Railway が再デプロイ
5. `https://あなたのサイトURL/admin/` を開く

## 重要
この段階では管理画面のファイル一式は入っていますが、GitHub 認証の設定はまだ必要です。
Decap CMS の GitHub backend は認証設定が必要です。

## まず動作確認する場所
- `/admin/`
- `/next-performers.html`
- `/past-performers.html`
- `/creators.html`

## 今回の方式
HTMLを毎回直接触る代わりに、以下のJSONを編集します。
- `data/site.json`
- `data/next-performers.json`
- `data/past-performers.json`
- `data/creators.json`
