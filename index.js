const express  = require('express');
const fetch    = require('node-fetch');

const app  = express();
const PORT = process.env.PORT || 3000;

const PROXY_SECRET = process.env.PROXY_SECRET || 'ica_npf_relay_2026';
const NPF_URL        = 'https://api.nopaperforms.io/lead/v1/create';
const NPF_SECRET_KEY = process.env.NPF_SECRET_KEY;
const NPF_ACCESS_KEY = process.env.NPF_ACCESS_KEY;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ICA NPF Relay Proxy running ✅' });
});

app.post('/relay', async (req, res) => {
  const clientSecret = req.headers['x-proxy-secret'];
  if (clientSecret !== PROXY_SECRET) {
    console.warn('❌ Unauthorized attempt from:', req.ip);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const payload = req.body;
  if (!payload || !payload.mobile) {
    return res.status(400).json({ error: 'Missing mobile field' });
  }

  console.log(`Relaying lead — mobile: ${payload.mobile}, center: ${payload.cf_center}`);

  try {
    const npfRes = await fetch(NPF_URL, {
      method : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'secret-key'  : NPF_SECRET_KEY,
        'access-key'  : NPF_ACCESS_KEY
      },
      body: JSON.stringify(payload)
    });

    const statusCode = npfRes.status;
    const body       = await npfRes.text();
    console.log(`NPF responded ${statusCode}: ${body.substring(0, 200)}`);
    res.status(statusCode).send(body);

  } catch (err) {
    console.error('❌ Fetch error:', err.message);
    res.status(500).json({ error: 'Proxy fetch failed', detail: err.message });
  }
});

app.listen(PORT, () => console.log(`✅ Proxy listening on port ${PORT}`));
