const { spawnSync } = require('child_process');
require('dotenv').config();

const run = (cmd, args = []) => {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: false });
  return r.status === 0;
};

if (!process.env.SKIP_DB_INIT) {
  if (!run('node', ['scripts/init-db.js'])) {
    console.error('数据库初始化失败，已停止启动。请检查 .env 配置（DB_HOST/DB_PORT/DB_USER/DB_PASS/DB_NAME）。');
    process.exit(1);
  }
}

require('../src/app');
