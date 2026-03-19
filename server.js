const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'MJSS site' });
});

app.post('/api/apply', async (req, res) => {
  try {
    const { name = '', xAccount = '', category = '', message = '' } = req.body || {};

    if (!name.trim()) {
      return res.status(400).json({ ok: false, message: 'お名前は必須です。' });
    }

    if (!DISCORD_WEBHOOK_URL) {
      return res.json({
        ok: true,
        message: 'フォーム送信の見た目確認は完了です。Railwayの環境変数 DISCORD_WEBHOOK_URL を入れるとDiscord通知も動きます。'
      });
    }

    const content = [
      '【MJSS 参加フォーム】',
      `名前: ${name}`,
      `X: ${xAccount || '未記入'}`,
      `区分: ${category || '未選択'}`,
      'メッセージ:',
      message || '未記入'
    ].join('\n');

    const webhookRes = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });

    if (!webhookRes.ok) {
      const text = await webhookRes.text();
      return res.status(500).json({ ok: false, message: `Discord送信失敗: ${text}` });
    }

    res.json({ ok: true, message: '送信できました。' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: 'サーバーエラーが発生しました。' });
  }
});

app.listen(PORT, () => {
  console.log(`MJSS site listening on ${PORT}`);
});
