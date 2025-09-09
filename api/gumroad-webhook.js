// api/gumroad-webhook.js
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET-пинг для быстрых проверок
  if (req.method === 'GET') {
    console.log('📬 [GUMROAD] GET ping', {
      method: req.method,
      query: req.query,
      headers: {
        'user-agent': req.headers['user-agent'],
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'x-real-ip': req.headers['x-real-ip'],
        'content-type': req.headers['content-type'],
      },
    });
    return res.status(200).send('OK');
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const contentType = req.headers['content-type'] || '';
    let parsedBody = {};

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const raw = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => (data += chunk));
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });
      parsedBody = Object.fromEntries(new URLSearchParams(raw));
    } else if (contentType.includes('application/json')) {
      parsedBody = req.body || {};
    } else {
      const raw = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => (data += chunk));
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });
      try {
        parsedBody = Object.fromEntries(new URLSearchParams(raw));
      } catch {
        parsedBody = { raw };
      }
    }

    console.log('📬 [GUMROAD] Webhook received', {
      method: req.method,
      contentType,
      query: req.query,
      headers: {
        'user-agent': req.headers['user-agent'],
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'x-real-ip': req.headers['x-real-ip'],
        'content-type': req.headers['content-type'],
        'content-length': req.headers['content-length'],
      },
      body: parsedBody,
    });

    return res.status(200).send('OK');
  } catch (error) {
    console.error('❌ [GUMROAD] Error handling webhook:', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}