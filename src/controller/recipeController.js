const { getRecipeByConstitution, getMaterialByRecipeId } = require('../service/recipeService');

async function getRecipe(ctx) {
  try {
    const { constitution } = ctx.query || {};
    if (!constitution) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '参数错误', data: null };
      return;
    }
    const list = await getRecipeByConstitution(constitution);
    ctx.body = { code: 200, message: '成功', data: list };
  } catch (e) {
    ctx.status = 500;
    ctx.body = { code: 500, message: '服务异常', data: null };
  }
}

async function getMaterial(ctx) {
  try {
    const { recipeId } = ctx.query || {};
    const id = Number(recipeId);
    if (!id) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '参数错误', data: null };
      return;
    }
    const url = await getMaterialByRecipeId(id);
    ctx.body = { code: 200, message: '成功', data: { videoUrl: url } };
  } catch (e) {
    ctx.status = 500;
    ctx.body = { code: 500, message: '服务异常', data: null };
  }
}

module.exports = { getRecipe, getMaterial };
