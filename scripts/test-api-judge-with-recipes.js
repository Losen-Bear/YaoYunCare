const http = require('http');

function postJson(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      },
      (res) => {
        let buf = '';
        res.setEncoding('utf8');
        res.on('data', (d) => (buf += d));
        res.on('end', () => resolve({ status: res.statusCode, body: buf }));
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  const cases = [
    { name: 'qixu_full', payload: { answers: { 5: 1, 6: 1, 7: 1 } }, expected: ['气虚质'] },
    { name: 'yang2_yin1', payload: { answers: { 8: 1, 9: 1, 11: 1 } }, expected: ['阳虚质', '阴虚质'] },
    { name: 'all_zero', payload: { answers: {} }, expected: ['平和质'] }
  ];
  for (const c of cases) {
    const r = await postJson('/api/constitution/judge-with-recipes', c.payload);
    if (r.status !== 200) {
      throw new Error(`HTTP ${r.status}: ${r.body}`);
    }
    let json = null;
    try {
      json = JSON.parse(r.body);
    } catch (e) {
      throw new Error(`Invalid JSON: ${r.body}`);
    }
    if (json.code !== 200) {
      throw new Error(`API code=${json.code} msg=${json.message || ''}`);
    }
    const data = json.data || {};
    const recipes = data.recipes || {};
    const merged = data.merged || [];
    if (c.expected.length === 0) {
      if (Object.keys(recipes).length !== 0) {
        throw new Error(`Expected no recipes keys but got ${Object.keys(recipes).join(',')}`);
      }
    } else {
      const ok = c.expected.every((k) => Array.isArray(recipes[k]));
      if (!ok) {
        throw new Error(`Missing expected keys: ${c.expected.filter((k) => !Array.isArray(recipes[k])).join(',')}`);
      }
    }
    const hasVideoField = merged.every((item) => Object.prototype.hasOwnProperty.call(item, 'video_url'));
    if (!hasVideoField) {
      throw new Error(`Merged items missing video_url field`);
    }
    const keys = Object.keys(recipes);
    const counts = keys.map((k) => `${k}:${Array.isArray(recipes[k]) ? recipes[k].length : 0}`).join(',');
    console.log(`PASS ${c.name} primary=${JSON.stringify(data.result?.primary || [])} keys=[${keys.join(',')}] ${counts} merged=${merged.length}`);
  }
  console.log('All cases passed');
})().catch((e) => {
  console.error('Request error:', e.message);
  process.exit(1);
});

