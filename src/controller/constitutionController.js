const { judgeConstitution } = require('../service/constitutionService');

async function judge(ctx) {
  try {
    const { symptoms } = ctx.request.body || {};
    if (!Array.isArray(symptoms)) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '参数错误', data: null };
      return;
    }
    const result = await judgeConstitution(symptoms);
    ctx.body = { code: 200, message: '成功', data: result };
  } catch (e) {
    ctx.status = 500;
    ctx.body = { code: 500, message: '服务异常', data: null };
  }
}

module.exports = { judge };
