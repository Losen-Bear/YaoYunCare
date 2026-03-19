const { scoreByQuestionnaire } = require('../src/service/constitutionService');

function runCase(name, answers) {
  const r = scoreByQuestionnaire(answers);
  console.log(name, JSON.stringify(r));
}

runCase('all_zero', {});
runCase('qixu_full', { 5: 1, 6: 1, 7: 1 });
runCase('yangxu2_yinxu1', { 8: 1, 9: 1, 11: 1 });

