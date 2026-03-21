【このZIPの使い方】

1. そのままリポジトリ直下へドラッグ＆ドロップで入れる
   - games/invader.html
   - data/invader-config.json
   - data/sounds.json

2. すでに .pages.yml は入れてある前提です。
   Pages CMSで「インベーダー設定」「サウンド設定」が表示されます。

3. おまけ一覧に出したい場合は、
   data/omake-links.json の items に
   data/omake-links.invader.add.json の中身を1件追加してください。

4. 画像や音の差し替え方法は2つあります。
   A. 永続変更: Pages CMS で invader-config.json / sounds.json を更新
   B. その場だけ変更: games/invader.html 右側にファイルをドラッグ＆ドロップ

5. 画像や音が未設定でもゲームは動きます。
   その場合はフォールバックの図形表示になります。

【ゲーム内操作】
- PC: 左右キー / A,D / スペース
- スマホ: 左右ボタン / 発射ボタン / 画面横ドラッグ

【将来ランキングを足す場所】
- games/invader.html 内の gameOver() で window.sendScore(score) を呼ぶ構造にしてあります。
