require('dotenv').config();
const https = require('https');

const KEY = process.env.GEMINI_API_KEY;
const MODELS = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-latest'];

console.log('Key prefix :', KEY?.slice(0, 15) + '...');
console.log('Key length :', KEY?.length);
console.log('---');

function testModel(model, authMode) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: 'Hello World. Reply in one sentence.' }] }],
    });

    const isBearer = authMode === 'bearer';
    const path = isBearer
      ? `/v1beta/models/${model}:generateContent`
      : `/v1beta/models/${model}:generateContent?key=${KEY}`;

    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    };
    if (isBearer) headers['Authorization'] = `Bearer ${KEY}`;

    const opts = {
      hostname: 'generativelanguage.googleapis.com',
      path,
      method: 'POST',
      headers,
    };

    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.candidates?.[0]?.content?.parts?.[0]?.text) {
            resolve({ ok: true, text: json.candidates[0].content.parts[0].text });
          } else {
            resolve({ ok: false, code: json.error?.code, msg: json.error?.message?.slice(0, 120) });
          }
        } catch {
          resolve({ ok: false, msg: 'JSON parse error' });
        }
      });
    });

    req.on('error', (e) => resolve({ ok: false, msg: e.message }));
    req.setTimeout(10000, () => { req.destroy(); resolve({ ok: false, msg: 'timeout' }); });
    req.write(body);
    req.end();
  });
}

(async () => {
  for (const model of MODELS) {
    for (const mode of ['apikey', 'bearer']) {
      process.stdout.write(`Testing ${model} [${mode}] ... `);
      const result = await testModel(model, mode);
      if (result.ok) {
        console.log(`✅ OK → "${result.text.trim()}"`);
        console.log(`\n🎉 WORKING: model=${model} auth=${mode}`);
        process.exit(0);
      } else {
        console.log(`❌ ${result.code || ''} ${result.msg}`);
      }
    }
  }
  console.log('\n❌ Semua model gagal. Kemungkinan:');
  console.log('   1. OAuth token sudah expired (AQ. hanya valid 1 jam)');
  console.log('   2. Generative Language API belum di-enable di project ini');
  console.log('   3. Project belum punya quota Gemini');
  console.log('\n→ Solusi: https://console.cloud.google.com/apis/credentials → buat API key baru (format AIza)');
})();
