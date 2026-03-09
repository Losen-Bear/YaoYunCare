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
  const forceSeed = process.env.DB_FORCE_SEED === '1';

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

  if (forceSeed) {
    await conn.query(`SET FOREIGN_KEY_CHECKS=0`);
    await conn.query(`TRUNCATE TABLE recipe`);
    await conn.query(`TRUNCATE TABLE symptom_rule`);
    await conn.query(`TRUNCATE TABLE constitution`);
    await conn.query(`SET FOREIGN_KEY_CHECKS=1`);
  }

  const [c1] = await conn.query(`SELECT COUNT(*) AS c FROM constitution`);
  if ((c1[0] && c1[0].c === 0) || (!c1[0])) {
    await conn.query(
      `INSERT INTO constitution (name) VALUES 
      ('平和质'),
      ('气虚质'),
      ('阳虚质'),
      ('阴虚质'),
      ('痰湿质'),
      ('湿热质'),
      ('血瘀质'),
      ('气郁质'),
      ('特禀质')`
    );
  }

  const [c2] = await conn.query(`SELECT COUNT(*) AS c FROM symptom_rule`);
  if ((c2[0] && c2[0].c === 0) || (!c2[0])) {
    await conn.query(
      `INSERT INTO symptom_rule (constitution_id, symptom_list) VALUES 
      (1, '[]'),
      (2, '["神疲乏力","少气懒言","易出汗","食欲不振","大便稀溏","舌淡胖有齿痕"]'),
      (3, '["畏寒","手脚冰凉","面色苍白","腰膝冷痛","大便稀溏","舌淡苔白"]'),
      (4, '["口干咽燥","手足心热","盗汗","失眠","大便干结","舌红少苔"]'),
      (5, '["形体肥胖","胸闷","痰多","口黏腻","大便粘滞","舌苔厚腻"]'),
      (6, '["口苦口臭","面油长痘","小便黄赤","大便粘滞","舌苔黄厚"]'),
      (7, '["肤色暗沉","痛经血块","刺痛","易淤青","舌质暗紫"]'),
      (8, '["情绪低落","胸闷叹气","胁肋胀痛","失眠多梦","食欲不振"]'),
      (9, '["易过敏","皮肤瘙痒","打喷嚏","鼻涕清稀"]')`
    );
  }

  const [c3] = await conn.query(`SELECT COUNT(*) AS c FROM recipe`);
  if ((c3[0] && c3[0].c === 0) || (!c3[0])) {
    await conn.query(
      `INSERT INTO recipe (name, constitution, ingredients, steps, video_url) VALUES 
      ('杂粮养生粥', '平和质', '["小米30g","糙米20g","燕麦20g","红枣5颗(去核)","枸杞5g","水800ml"]', '["1. 食材淘洗干净并浸泡30分钟","2. 加水煮沸后小火熬煮40分钟"]', ''),
      ('山药小米粥', '气虚质', '["山药150g(去皮切块)","小米50g","大米20g","水700ml"]', '["1. 山药切块焯水1分钟","2. 加水煮沸后小火煮30分钟","3. 加入山药再煮15分钟"]', ''),
      ('当归生姜羊肉汤', '阳虚质', '["羊肉500g","当归10g","生姜30g"]', '["1. 羊肉焯水","2. 加水与当归、生姜同煮","3. 小火慢炖60分钟"]', ''),
      ('银耳雪梨汤', '阴虚质', '["银耳10g","雪梨1个(去核切块)","枸杞5g","冰糖10g","水600ml"]', '["1. 银耳泡发撕成小朵","2. 加水煮银耳20分钟","3. 加入雪梨与枸杞再煮15分钟","4. 加冰糖调味"]', ''),
      ('莲米红豆粥', '痰湿质', '["莲米30g","红豆20g","大米40g","水800ml"]', '["1. 红豆提前浸泡4小时","2. 加水煮沸后小火熬40分钟","3. 加入莲米与大米再煮30分钟"]', ''),
      ('绿豆汤', '湿热质', '["绿豆50g","冰糖10g(可选)","水800ml"]', '["1. 绿豆淘洗浸泡2小时","2. 加水煮沸后小火煮30分钟","3. 加冰糖调味"]', ''),
      ('当归红枣茶', '血瘀质', '["当归5g","红枣5枚(去核)","枸杞5g","水500ml"]', '["1. 所有食材洗净","2. 加水同煮，小火煮20分钟","3. 过滤温饮"]', ''),
      ('玫瑰花茶', '气郁质', '["玫瑰花5g(干)","枸杞3g","冰糖5g(可选)","水400ml"]', '["1. 玫瑰花枸杞洗净","2. 加水煮沸后小火煮10分钟","3. 加入冰糖调味"]', ''),
      ('陈皮茯苓粥', '气郁质', '["陈皮3g","茯苓粉10g","大米50g","水700ml"]', '["1. 陈皮泡软切丝","2. 加水与大米同煮30分钟","3. 加入茯苓粉搅匀再煮5分钟"]', ''),
      ('香附炖排骨', '气郁质', '["香附6g","排骨200g(切块)","生姜2片","盐2g"]', '["1. 排骨焯水去血沫","2. 加香附与生姜小火炖60分钟","3. 加盐调味"]', ''),
      ('玉屏风粥', '特禀质', '["黄芪10g","防风5g","白术5g","大米50g","水800ml"]', '["1. 黄芪、防风、白术洗净浸泡20分钟","2. 大米淘洗备用","3. 先煮药汁后加入大米小火煮30分钟"]', ''),
      ('红枣枸杞小米粥', '特禀质', '["红枣5颗(去核)","枸杞5g","小米50g","水700ml"]', '["1. 小米浸泡20分钟","2. 加水煮沸后小火煮30分钟","3. 加入枸杞与红枣再煮5分钟"]', ''),
      ('清蒸鲈鱼', '特禀质', '["鲈鱼500g","生姜2片","葱段1段","盐2g","蒸鱼豉油10ml"]', '["1. 鲈鱼处理去腥","2. 盘底垫姜片葱段放鱼","3. 沸水蒸8分钟","4. 淋蒸鱼豉油"]', ''),
      ('丹参黄芪炖鸡', '特禀质', '["丹参10g","黄芪8g","鸡肉200g(切块)","生姜2片","盐2g"]', '["1. 鸡肉焯水去血沫","2. 加入丹参、黄芪与生姜同炖60分钟","3. 加盐调味"]', ''),
      ('黑木耳炒芥菜', '特禀质', '["黑木耳5g(泡发切丝)","芥菜200g(切段)","盐2g","食用油5ml"]', '["1. 芥菜焯水1分钟","2. 热锅加油放木耳翻炒1分钟","3. 加入芥菜再炒1分钟","4. 加盐调味"]', '')`
    );
  }

  await conn.end();
  console.log('数据库初始化完成');
})().catch((e) => {
  console.error('数据库初始化失败', e.message);
  process.exit(1);
});
