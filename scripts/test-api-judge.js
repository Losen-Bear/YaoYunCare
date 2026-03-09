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
    { name: 'qixu_full', payload: { answers: { 5: 1, 6: 1, 7: 1 } } },
    { name: 'yang2_yin1', payload: { answers: { 8: 1, 9: 1, 11: 1 } } },
    { name: 'all_zero', payload: { answers: {} } }
  ];
  for (const c of cases) {
    const r = await postJson('/api/constitution/judge', c.payload);
    console.log(`> ${c.name} status=${r.status} body=${r.body}`);
  }
})().catch((e) => {
  console.error('Request error:', e.message);
  process.exit(1);
});

