MJSS インベーダー 全体ランキング導入手順

【1】フロント側
- games/invader.html を丸ごと置き換え
- data/invader-config.json を丸ごと置き換え

【2】Railway に server フォルダを新しいサービスとして入れる
- Root Directory: server
- Start Command: npm start
- Volume を /data にマウント推奨
- 環境変数 INVADER_DB_PATH=/data/invader_rankings.db を推奨
- 別ドメイン運用なら CORS_ORIGIN にサイトURLを入れる

【3】今のサイトと同じ Railway サービス内で API を出す場合
- invader-config.json の ranking.api_base は空のままでOK
- ゲームは同一オリジンの /api/invader/... を読みに行く

【4】ランキング API を別 Railway ドメインにした場合
- data/invader-config.json の ranking.api_base に API ドメインを入れる
  例: https://xxxx.up.railway.app

【5】確認URL
- /api/invader/health
- /api/invader/leaderboard

補足
- ランキングは「同じ名前ごとにベスト1件」を保持
- 新しいスコアが自己ベストを超えた時だけ更新
- DB は Volume を付けないと再デプロイ時に消える可能性あり
