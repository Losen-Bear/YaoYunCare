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

function normalizeAnswers(answers) {
  const map = {};
  if (Array.isArray(answers)) {
    answers.forEach((v, i) => {
      const idx = i + 1;
      map[idx] = v;
    });
  } else if (answers && typeof answers === 'object') {
    Object.keys(answers).forEach((k) => {
      const idx = Number(k);
      if (idx > 0) map[idx] = answers[k];
    });
  }
  const toBool = (v) => {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v > 0;
    if (typeof v === 'string') {
      const s = v.trim().toLowerCase();
      return s === '是' || s === 'yes' || s === 'true' || s === '1';
    }
    if (v && typeof v === 'object') {
      const val = v.answer ?? v.value ?? v.v ?? v.checked;
      return toBool(val);
    }
    return false;
  };
  const boolMap = {};
  Object.keys(map).forEach((k) => {
    const v = map[k];
    boolMap[Number(k)] = toBool(v);
  });
  return boolMap;
}

function scoreByQuestionnaire(answers) {
  const a = normalizeAnswers(answers);
  const groups = [
    { name: '气虚质', q: [5, 6, 7] },
    { name: '阳虚质', q: [8, 9, 10] },
    { name: '阴虚质', q: [11, 12, 13] },
    { name: '痰湿质', q: [14, 15, 16] },
    { name: '湿热质', q: [17, 18, 19] },
    { name: '血瘀质', q: [20, 21, 22] },
    { name: '气郁质', q: [23, 24, 25] },
    { name: '特禀质', q: [26, 27, 28] }
  ];
  const detail = groups.map((g) => {
    const count = g.q.reduce((sum, q) => sum + (a[q] ? 1 : 0), 0);
    return { constitution: g.name, count };
  });
  const allZero = detail.every((d) => d.count === 0);
  if (allZero) {
    return {
      mainConstitution: '平和质',
      matchDetail: detail,
      decision: { type: 'neutral', topGap: 0 },
      primary: []
    };
  }
  const sorted = [...detail].sort((x, y) => y.count - x.count);
  const top = sorted[0];
  const second = sorted[1] || { count: 0 };
  const gap = top.count - second.count;
  const topTies = sorted.filter((d) => d.count === top.count).map((d) => d.constitution);
  if (topTies.length >= 3) {
    return {
      mainConstitution: '复合兼夹体质',
      matchDetail: detail,
      decision: { type: 'complex', topGap: 0 },
      primary: topTies
    };
  }
  if (topTies.length === 2) {
    const main = `${topTies[0]}+${topTies[1]}`;
    return {
      mainConstitution: main,
      matchDetail: detail,
      decision: { type: 'dual', topGap: 0 },
      primary: topTies
    };
  }
  if (gap >= 2) {
    return {
      mainConstitution: top.constitution,
      matchDetail: detail,
      decision: { type: 'single', topGap: gap },
      primary: [top.constitution]
    };
  }
  const main = `${top.constitution}+${second.constitution}`;
  return {
    mainConstitution: main,
    matchDetail: detail,
    decision: { type: 'mixed', topGap: gap },
    primary: [top.constitution, second.constitution]
  };
}

module.exports = { judgeConstitution, scoreByQuestionnaire };
