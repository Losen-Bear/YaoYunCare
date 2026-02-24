require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASS || '';
  const port = Number(process.env.DB_PORT || 3306);
  const dbName = process.env.DB_NAME || 'constitution_recipe';

  const rootConn = await mysql.createConnection({ host, user, password, port, multipleStatements: true });
  await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await rootConn.end();

  const conn = await mysql.createConnection({ host, user, password, port, database: dbName, multipleStatements: true });

  await conn.query(
    `CREATE TABLE IF NOT EXISTS constitution (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(50) NOT NULL
    )`
  );

  await conn.query(
    `CREATE TABLE IF NOT EXISTS symptom_rule (
      id INT PRIMARY KEY AUTO_INCREMENT,
      constitution_id INT,
      symptom_list JSON
    )`
  );

  await conn.query(
    `CREATE TABLE IF NOT EXISTS recipe (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      constitution VARCHAR(50) NOT NULL,
      ingredients TEXT,
      steps TEXT,
      video_url VARCHAR(500)
    )`
  );

  const [c1] = await conn.query(`SELECT COUNT(*) AS c FROM constitution`);
  if ((c1[0] && c1[0].c === 0) || (!c1[0])) {
    await conn.query(`INSERT INTO constitution (name) VALUES ('阳虚质'), ('阴虚质'), ('气虚质'), ('平和质')`);
  }

  const [c2] = await conn.query(`SELECT COUNT(*) AS c FROM symptom_rule`);
  if ((c2[0] && c2[0].c === 0) || (!c2[0])) {
    await conn.query(
      `INSERT INTO symptom_rule (constitution_id, symptom_list) VALUES 
      (1, '["畏寒","手脚冰凉","大便稀溏"]'),
      (2, '["口干","手心热","失眠"]'),
      (3, '["易累","气短","易感冒"]'),
      (4, '[]')`
    );
  }

  const [c3] = await conn.query(`SELECT COUNT(*) AS c FROM recipe`);
  if ((c3[0] && c3[0].c === 0) || (!c3[0])) {
    await conn.query(
      `INSERT INTO recipe (name, constitution, ingredients, steps, video_url) VALUES 
      ('当归生姜羊肉汤', '阳虚质', '["羊肉500g","当归10g","生姜30g"]', '["1. 羊肉焯水","2. 加水煮沸后慢炖1小时"]', 'https://player.bilibili.com/player.html?aid=123456'),
      ('银耳百合粥', '阴虚质', '["银耳10g","百合15g","大米50g"]', '["1. 银耳泡发","2. 与百合、大米同煮30分钟"]', '/pages/recipe/video/银耳百合粥.mp4')`
    );
  }

  await conn.end();
  console.log('数据库初始化完成');
})().catch((e) => {
  console.error('数据库初始化失败', e.message);
  process.exit(1);
});
