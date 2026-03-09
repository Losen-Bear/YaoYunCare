const { judgeConstitution, scoreByQuestionnaire } = require('../service/constitutionService');
const recipeService = require('../service/recipeService');

async function judge(ctx) {
  try {
    const { symptoms, answers } = ctx.request.body || {};
    let result = null;
    if (answers !== undefined) {
      result = scoreByQuestionnaire(answers);
    } else if (Array.isArray(symptoms)) {
      result = await judgeConstitution(symptoms);
    } else {
      ctx.status = 400;
      ctx.body = { code: 400, message: '参数错误', data: null };
      return;
    }
    ctx.body = { code: 200, message: '成功', data: result };
  } catch (e) {
    ctx.status = 500;
    ctx.body = { code: 500, message: '服务异常', data: null };
  }
}

async function judgeWithRecipes(ctx) {
  try {
    const { symptoms, answers } = ctx.request.body || {};
    let result = null;
    if (answers !== undefined) {
      result = scoreByQuestionnaire(answers);
    } else if (Array.isArray(symptoms)) {
      result = await judgeConstitution(symptoms);
    } else {
      ctx.status = 400;
      ctx.body = { code: 400, message: '参数错误', data: null };
      return;
    }
    let targets = [];
    if (Array.isArray(result?.primary) && result.primary.length > 0) {
      targets = result.primary;
    } else if (typeof result?.mainConstitution === 'string' && result.mainConstitution.length > 0) {
      targets = result.mainConstitution.split('+').map((s) => s.trim()).filter(Boolean);
    }
    const recipes = {};
    for (const t of targets) {
      try {
        recipes[t] = await recipeService.getRecipeByConstitution(t);
      } catch {
        recipes[t] = [];
      }
    }
    const merged = Object.values(recipes).flat();
    ctx.body = { code: 200, message: '成功', data: { result, recipes, merged } };
  } catch {
    ctx.status = 500;
    ctx.body = { code: 500, message: '服务异常', data: null };
  }
}

module.exports = { judge, judgeWithRecipes };
