
const Category = require('../models/Category');

class AiCategorizationService {
  
  /**
   * Analyzes product data to suggest categories.
   * Simulates NLP by matching keywords in name/description against category names.
   */
  async suggestCategories(product) {
    const textCorpus = `${product.name} ${product.description}`.toLowerCase();
    const allCategories = await Category.find({ isActive: true }).select('name _id slug metadata');
    
    const suggestions = [];
    
    for (const cat of allCategories) {
      let score = 0;
      const catName = cat.name.toLowerCase();
      
      // Exact match boost
      if (textCorpus.includes(catName)) {
        score += 0.5;
      }
      
      // Metadata keyword match
      if (cat.metadata && cat.metadata.description) {
        const keywords = cat.metadata.description.toLowerCase().split(' ');
        const matches = keywords.filter(k => textCorpus.includes(k) && k.length > 3);
        if (matches.length > 0) {
          score += (matches.length * 0.1);
        }
      }

      // Metadata specific tag matching (simulated)
      if (cat.metadata && cat.metadata.style && textCorpus.includes(cat.metadata.style.toLowerCase())) {
        score += 0.3;
      }

      // Cap score at 0.99
      score = Math.min(score, 0.99);

      if (score > 0.3) {
        suggestions.push({
          categoryId: cat._id,
          categoryName: cat.name,
          confidenceScore: parseFloat(score.toFixed(2))
        });
      }
    }

    // Sort by confidence
    suggestions.sort((a, b) => b.confidenceScore - a.confidenceScore);

    return {
      suggestedCategories: suggestions.map(s => s.categoryId),
      details: suggestions // Return details for UI debugging if needed
    };
  }
}

module.exports = new AiCategorizationService();
