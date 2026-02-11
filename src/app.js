const Koa = require('koa');
const router = require('./routes');
const bodyParser = require('koa-bodyparser');
const cors = require('koa2-cors');

const app = new Koa();
app.use(cors({ origin: '*', credentials: true }));
app.use(bodyParser({ enableTypes: ['json'] }));
app.use(router.routes()).use(router.allowedMethods());

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`服务端启动成功！地址：http://localhost:${port}`);
});
