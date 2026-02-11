const Router = require('koa-router');
const constitutionController = require('../controller/constitutionController');
const recipeController = require('../controller/recipeController');

const router = new Router();
router.get('/', async (ctx) => {
  ctx.body = 'API 正常运行';
});
router.post('/api/constitution/judge', constitutionController.judge);
router.get('/api/recipe/list', recipeController.getRecipe);
router.get('/api/recipe/material', recipeController.getMaterial);
router.get('/api/health/check', async (ctx) => {
  ctx.body = { code: 200, message: '服务端正常运行', data: null };
});

module.exports = router;
