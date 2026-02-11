const mysql = require('../config/db');

async function judgeConstitution(symptoms) {
  const [rows] = await mysql.query(`
    SELECT c.name AS constitution, sr.symptom_list
    FROM symptom_rule sr
    LEFT JOIN constitution c ON sr.constitution_id = c.id
  `);
  const counts = rows.map((row) => {
    let list = [];
    try {
      list = JSON.parse(row.symptom_list || '[]');
    } catch {}
    const count = list.filter((s) => symptoms.includes(s)).length;
    return { constitution: row.constitution, count };
  });
  counts.sort((a, b) => b.count - a.count);
  const mainConstitution = counts[0]?.constitution || '';
  return { mainConstitution, matchDetail: counts };
}

module.exports = { judgeConstitution };
