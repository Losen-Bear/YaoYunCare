module.exports = {
  DEFAULT_COVER: 'https://res.wx.qq.com/op_res/Y3uW5mC3E-placeholder-avatar.png',
  STORAGE_KEYS: {
    OPENID: 'openid',
    IS_LOGGED_IN: 'isLoggedIn',
    LAST_ANSWERS: 'lastAnswers',
    LAST_JUDGE_RESULT: 'lastJudgeResult',
    JUDGE_HISTORY: 'judgeHistory',
    DAILY_RECOMMEND_RECIPE: 'dailyRecommendRecipe',
    FAVORITES: 'favorites',
    SAVED_REPORTS: 'savedReports',
    CONSTITUTION_RESULT: 'constitution_result',
    USER_PROFILE: 'userProfile',
    ALL_RECIPES: 'allRecipes'
  },
  API_ROUTES: {
    CONSTITUTION_JUDGE_WITH_RECIPES: '/api/constitution/judge-with-recipes',
    HEALTH_CHECK: '/api/health/check',
    AUTH_WX_LOGIN: '/api/auth/wx-login'
  },
  CLOUD_FUNCTIONS: {
    '/api/constitution/judge-with-recipes': 'judgeWithRecipes',
    '/api/health/check': 'health',
    '/api/auth/wx-login': 'login'
  },
  PAGES: {
    HOME: '/pages/home/index',
    ASSESSMENT: '/pkg-assessment/pages/assessment/index',
    ASSESSMENT_NOTICE: '/pkg-assessment/pages/notice/index',
    LOGIN: '/pkg-user/pages/login/index',
    CONSTITUTION: '/pkg-user/pages/constitution/index',
    RECIPE_DETAIL: '/pkg-detail/pages/recipe-detail/index',
    RECIPES: '/pages/recipes/index',
    ASSISTANT: '/pages/assistant/index',
    PROFILE: '/pages/profile/index'
  }
}
