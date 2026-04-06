# YaoYunCare

药韵养生虚拟人物智能导护小程序（微信小程序 + 云开发）。

## 项目简介

YaoYunCare 是一个围绕“中医体质辨识 + 药膳推荐”的微信小程序项目，提供从体质测评到个性化药膳浏览的完整体验。项目采用微信小程序原生开发，并结合微信云函数实现登录与推荐能力。

## 版本信息

- 当前开发版本：`v1.0`
- 版本状态：持续开发中（功能迭代与体验优化）

### v1.0 已实现功能

- 体质测评：基于问卷答案进行体质判定
- 药膳推荐：按体质返回推荐药膳列表
- 药膳详情：展示食材、步骤、功效、禁忌等信息
- 每日推荐：首页展示每日随机推荐药膳
- 微信登录：通过 `wx.login + 云函数` 获取身份信息
- 云端图片处理：支持 cloud:// 文件 ID 转临时可访问链接

## 功能特性

- 体质测评：基于问卷答案进行体质判定
- 药膳推荐：按体质返回推荐药膳列表
- 药膳详情：展示食材、步骤、功效、禁忌等信息
- 每日推荐：首页展示每日随机推荐药膳
- 微信登录：通过 `wx.login + 云函数` 获取身份信息
- 云端图片处理：支持 cloud:// 文件 ID 转临时可访问链接

## 技术栈

- 前端：微信小程序原生（WXML / WXSS / JavaScript）
- 后端：微信云函数（Node.js）
- 数据：微信云开发数据库（当前代码中使用 `recipe`、`users` 集合）
- 代码规范：ESLint

## 项目结构

```text
YaoYunCare
├─ miniprogram/              # 小程序源码
│  ├─ pages/                 # 主包页面（首页/药膳馆/助手/我的）
│  ├─ pkg-assessment/        # 分包：体质测评
│  ├─ pkg-detail/            # 分包：药膳详情
│  ├─ pkg-user/              # 分包：登录/体质信息
│  ├─ api/request.js         # 请求封装（云函数映射）
│  └─ config/env.js          # 云环境配置
├─ cloudfunctions/           # 云函数
│  ├─ login/                 # 微信登录
│  ├─ judgeWithRecipes/      # 体质判定与药膳推荐
│  └─ health/                # 健康检查/临时链接辅助
├─ docs/                     # 项目分析与设计文档
├─ scripts/                  # 辅助脚本
└─ package.json
```

## 快速开始

### 1. 环境准备

- Node.js 14+（建议 LTS）
- 微信开发者工具
- 微信云开发环境（已开通并可部署云函数）

### 2. 安装依赖

```bash
npm install
```

如果需要本地调试云函数依赖，请在每个云函数目录单独安装：

```bash
cd cloudfunctions/login && npm install
cd ../judgeWithRecipes && npm install
cd ../health && npm install
```

### 3. 配置云环境

编辑 `miniprogram/config/env.js`：

- `useCloud`: 是否启用云开发（默认 `true`）
- `cloudEnv`: 你的云环境 ID
- `imageCDN`: 图片 CDN（可选）

### 4. 导入微信开发者工具

1. 使用微信开发者工具打开项目根目录  
2. 确认 `project.config.json` 中小程序目录为 `miniprogram/`  
3. 在工具中构建 npm（如提示）  
4. 上传并部署 `cloudfunctions/` 下的云函数

### 5. 初始化云数据库（最小要求）

请确保以下集合可用：

- `recipe`：药膳数据（名称、体质、食材、步骤、图片、功效等）
- `users`：用户资料（openid、昵称、头像等）

## 云函数与接口映射

当前小程序请求通过 `miniprogram/api/request.js` 映射到云函数：

- `/api/constitution/judge-with-recipes` -> `judgeWithRecipes`
- `/api/health/check` -> `health`
- `/api/auth/wx-login` -> `login`

## 可用脚本

```bash
npm run lint
```

说明：

- 会校验 `miniprogram/**/*.js` 与 `cloudfunctions/**/*.js`
- 当前仓库未定义统一的 `test` 与 `typecheck` 脚本

## 开发说明

- 小程序启动入口：`miniprogram/app.js`
- 页面路由配置：`miniprogram/app.json`
- 默认使用云开发模式，不依赖独立后端服务

## 贡献指南

欢迎通过 Issue 和 Pull Request 参与改进：

1. Fork 本仓库并创建分支
2. 提交清晰、聚焦的变更
3. 提交 PR 并说明变更背景与测试方式

## 路线图（Roadmap）

- 完善体质评估规则与结果解释
- 增强药膳检索与筛选能力
- 补充自动化测试与持续集成流程

## 许可证

当前仓库暂未声明开源许可证；如需开源发布，建议补充 LICENSE 文件后再对外分发。
