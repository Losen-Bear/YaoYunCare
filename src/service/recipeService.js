const mysql = require('../config/db');

async function getRecipeByConstitution(constitution) {
  const [recipes] = await mysql.query(
    `
    SELECT id, name, ingredients, steps, video_url
    FROM recipe
    WHERE constitution = ?
  `,
    [constitution]
  );
  return recipes.map((r) => {
    let ingredients = [];
    let steps = [];
    try {
      ingredients = JSON.parse(r.ingredients || '[]');
    } catch {}
    try {
      steps = JSON.parse(r.steps || '[]');
    } catch {}
    return {
      id: r.id,
      name: r.name,
      constitution,
      ingredients,
      steps,
      video_url: r.video_url || ''
    };
  });
}

async function getMaterialByRecipeId(recipeId) {
  const [result] = await mysql.query(
    `
    SELECT video_url FROM recipe WHERE id = ?
  `,
    [recipeId]
  );
  return result[0]?.video_url || '';
}

module.exports = { getRecipeByConstitution, getMaterialByRecipeId };
