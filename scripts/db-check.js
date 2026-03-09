const pool = require('../src/config/db');

(async () => {
  try {
    const [r1] = await pool.query('SELECT 1 + 1 AS res');
    const sum = r1?.[0]?.res;
    const [r2] = await pool.query('SELECT COUNT(*) AS c FROM recipe');
    const count = r2?.[0]?.c;
    console.log(`数据库连通性OK: 1+1=${sum}, recipe行数=${count}`);
    process.exit(0);
  } catch (e) {
    console.error('数据库检查失败:', e.message);
    process.exit(1);
  } finally {
    try {
      await pool.end();
    } catch {}
  }
})();
