const { HfInference } = require('@huggingface/inference');
const natural = require('natural');
const compromise = require('compromise');
const FoodItem = require('../models/foodItem');
const cache = require('memory-cache');

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
const tokenizer = new natural.WordTokenizer();
const { SentimentAnalyzer } = natural;
const analyzer = new SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');

// Main analysis functions
const analyzeFeedback = async (text, context = 'item') => {
  if (!text || text.trim().length < 3) {
    return getDefaultAnalysis(context);
  }

  try {
    const [sentimentResult, emotionResult, summaryResult] = await Promise.all([
      analyzeSentiment(text),
      analyzeEmotion(text),
      generateSummary(text)
    ]);

    const sentiment = determineSentiment(sentimentResult.score);
    const { keywords, entities } = extractKeywordsAndEntities(text);
    const dominantEmotion = emotionResult[0]?.label || 'neutral';
    const recommendations = generateRecommendations({
      text,
      sentiment,
      dominantEmotion,
      keywords,
      context
    });

    return {
      sentiment,
      emotion: dominantEmotion,
      summary: summaryResult.summary_text,
      keywords,
      entities,
      recommendations,
      analyzedAt: new Date(),
      analysisContext: context
    };
    
  } catch (error) {
    console.error('Analysis error:', error);
    return getDefaultAnalysis(context, true);
  }
};

const analyzeUserFeedbackHistory = async (userId) => {
  const cacheKey = `user-feedback-${userId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const foodItems = await FoodItem.find({
      'feedback.userId': userId
    }).select('name feedback price category dietaryTags');

    const allFeedback = foodItems.flatMap(item => 
      item.feedback
        .filter(fb => fb.userId.equals(userId))
        .map(fb => ({
          ...fb.toObject(),
          foodItemName: item.name,
          foodItemId: item._id,
          foodCategory: item.category,
          dietaryTags: item.dietaryTags
        })));

    if (allFeedback.length === 0) {
      return getDefaultUserAnalysis();
    }

    const combinedComments = allFeedback.map(fb => fb.comment).filter(Boolean).join(' ');
    const combinedAnalysis = await analyzeCombinedFeedback(combinedComments);
    const ratingsAnalysis = analyzeRatings(allFeedback);
    const categoryAnalysis = analyzeByCategory(allFeedback);
    const dietaryAnalysis = analyzeDietaryPreferences(allFeedback);
    const timelineAnalysis = analyzeFeedbackTimeline(allFeedback);

    const result = {
      ...combinedAnalysis,
      ...ratingsAnalysis,
      ...categoryAnalysis,
      ...dietaryAnalysis,
      ...timelineAnalysis,
      totalFeedback: allFeedback.length,
      lastFeedbackDate: allFeedback.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt,
      analyzedAt: new Date()
    };

    cache.put(cacheKey, result, 60 * 60 * 1000); // Cache for 1 hour
    return result;

  } catch (error) {
    console.error('User feedback analysis error:', error);
    return {
      ...getDefaultUserAnalysis(),
      isError: true
    };
  }
};

// Helper functions
async function analyzeCombinedFeedback(text) {
  const [sentimentResult, emotionResult, summaryResult] = await Promise.all([
    analyzeSentiment(text),
    analyzeEmotion(text),
    generateSummary(text)
  ]);

  const sentiment = determineSentiment(sentimentResult.score);
  const dominantEmotion = emotionResult[0]?.label || 'neutral';
  const { keywords, entities } = extractKeywordsAndEntities(text);

  return {
    sentiment,
    emotion: dominantEmotion,
    summary: summaryResult.summary_text,
    keywords,
    entities,
    recommendations: generateRecommendations({
      text,
      sentiment,
      dominantEmotion,
      keywords,
      entities,
      context: 'user preferences'
    })
  };
}

function analyzeRatings(feedbackItems) {
  const ratings = feedbackItems.map(fb => fb.rating);
  const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  
  const positive = feedbackItems.filter(fb => fb.rating >= 4);
  const negative = feedbackItems.filter(fb => fb.rating <= 2);
  
  return {
    averageRating: avgRating.toFixed(1),
    positiveCount: positive.length,
    negativeCount: negative.length,
    preferredItems: [...new Set(positive.map(fb => fb.foodItemName))],
    dislikedItems: [...new Set(negative.map(fb => fb.foodItemName))],
    ratingDistribution: {
      1: feedbackItems.filter(fb => fb.rating === 1).length,
      2: feedbackItems.filter(fb => fb.rating === 2).length,
      3: feedbackItems.filter(fb => fb.rating === 3).length,
      4: feedbackItems.filter(fb => fb.rating === 4).length,
      5: feedbackItems.filter(fb => fb.rating === 5).length
    }
  };
}

function analyzeByCategory(feedbackItems) {
  const byCategory = {};
  
  feedbackItems.forEach(fb => {
    if (!fb.foodCategory) return;
    
    if (!byCategory[fb.foodCategory]) {
      byCategory[fb.foodCategory] = {
        count: 0,
        totalRating: 0,
        items: new Set()
      };
    }
    byCategory[fb.foodCategory].count++;
    byCategory[fb.foodCategory].totalRating += fb.rating;
    byCategory[fb.foodCategory].items.add(fb.foodItemName);
  });
  
  const categoryStats = Object.entries(byCategory).map(([category, data]) => ({
    category,
    averageRating: (data.totalRating / data.count).toFixed(1),
    itemCount: data.items.size,
    feedbackCount: data.count
  }));
  
  const sortedCategories = [...categoryStats].sort((a, b) => b.averageRating - a.averageRating);
  
  return {
    categoryAnalysis: categoryStats,
    bestCategory: sortedCategories[0],
    worstCategory: sortedCategories[sortedCategories.length - 1]
  };
}

function analyzeDietaryPreferences(feedbackItems) {
  const dietaryStats = {};
  
  feedbackItems.forEach(fb => {
    if (!fb.dietaryTags) return;
    
    fb.dietaryTags.forEach(tag => {
      if (!dietaryStats[tag]) {
        dietaryStats[tag] = {
          count: 0,
          totalRating: 0,
          items: new Set()
        };
      }
      dietaryStats[tag].count++;
      dietaryStats[tag].totalRating += fb.rating;
      dietaryStats[tag].items.add(fb.foodItemName);
    });
  });
  
  const dietaryAnalysis = Object.entries(dietaryStats).map(([tag, data]) => ({
    tag,
    averageRating: (data.totalRating / data.count).toFixed(1),
    itemCount: data.items.size,
    feedbackCount: data.count
  }));
  
  return {
    dietaryPreferences: dietaryAnalysis,
    preferredTags: dietaryAnalysis
      .filter(d => d.averageRating >= 4)
      .map(d => d.tag),
    avoidedTags: dietaryAnalysis
      .filter(d => d.averageRating <= 2)
      .map(d => d.tag)
  };
}

function analyzeFeedbackTimeline(feedbackItems) {
  const sortedByDate = [...feedbackItems].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  
  // Analyze rating trend over time
  const timeline = sortedByDate.map(fb => ({
    date: fb.createdAt,
    rating: fb.rating,
    foodItem: fb.foodItemName
  }));
  
  // Calculate trend (simple linear regression)
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  const n = timeline.length;
  
  timeline.forEach((fb, i) => {
    sumX += i;
    sumY += fb.rating;
    sumXY += i * fb.rating;
    sumXX += i * i;
  });
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const trend = slope > 0.1 ? 'improving' : slope < -0.1 ? 'declining' : 'stable';
  
  return {
    timeline,
    ratingTrend: trend,
    firstFeedbackDate: timeline[0]?.date,
    lastFeedbackDate: timeline[timeline.length - 1]?.date
  };
}

async function analyzeSentiment(text) {
  const score = analyzer.getSentiment(tokenizer.tokenize(text));
  return {
    score,
    comparative: score / text.split(' ').length
  };
}

async function analyzeEmotion(text) {
  return hf.textClassification({
    model: 'SamLowe/roberta-base-go_emotions',
    inputs: text,
  });
}

async function generateSummary(text) {
  return hf.summarization({
    model: 'facebook/bart-large-cnn',
    inputs: text,
    parameters: { max_length: 60 },
  });
}

function determineSentiment(score) {
  if (score < -3) return 'very negative';
  if (score < 0) return 'negative';
  if (score > 3) return 'very positive';
  if (score > 1) return 'positive';
  return 'neutral';
}

function extractKeywordsAndEntities(text) {
  const doc = compromise(text);
  
  const keywords = [
    ...new Set([
      ...doc.nouns().out('array'),
      ...doc.adjectives().out('array'),
      ...doc.verbs().out('array')
    ])
  ]
  .filter(word => word.length > 3)
  .slice(0, 10);

  const entities = {
    foods: doc.match('#Food').out('array'),
    ingredients: doc.match('#Ingredient').out('array'),
    cookingMethods: doc.match('#CookingMethod').out('array'),
    qualities: doc.match('#Quality').out('array')
  };

  return { keywords, entities };
}

function generateRecommendations({ text, sentiment, dominantEmotion, keywords, entities, context }) {
  const lowerText = text.toLowerCase();
  const recommendations = [];
  const warnings = [];

  // Context-specific base recommendations
  if (context === 'user preferences') {
    recommendations.push('Consider customer preferences when preparing their order');
    
    if (sentiment === 'positive') {
      recommendations.push('Customer has generally positive feedback - maintain quality');
    } else if (sentiment === 'negative') {
      warnings.push('Customer has had negative experiences - handle with extra care');
    }
  }

  // Sentiment-based recommendations
  if (sentiment === 'very negative') {
    warnings.push('Customer has had very negative experiences previously');
  } else if (sentiment === 'very positive') {
    recommendations.push('Customer has been very satisfied previously - maintain high standards');
  }

  // Emotion-based recommendations
  if (dominantEmotion === 'anger') {
    warnings.push('Customer has expressed frustration in past feedback');
  } else if (dominantEmotion === 'joy') {
    recommendations.push('Customer has expressed happiness with similar items previously');
  }

  // Keyword-based recommendations
  if (lowerText.includes('spicy') || keywords.includes('spicy')) {
    recommendations.push('Customer frequently mentions spice levels - adjust as needed');
  }

  if (lowerText.includes('salty') || keywords.includes('salty')) {
    warnings.push('Customer has complained about saltiness before - monitor salt content');
  }

  if (lowerText.includes('crunch') || keywords.includes('crisp')) {
    recommendations.push('Customer values texture - pay attention to crispness');
  }

  // Entity-based recommendations
  if (entities.ingredients.length > 0) {
    recommendations.push(`Notable ingredients mentioned: ${entities.ingredients.join(', ')}`);
  }

  if (entities.qualities.length > 0) {
    recommendations.push(`Customer values: ${entities.qualities.join(', ')}`);
  }

  // Default fallback recommendations
  if (recommendations.length <= 2) {
    recommendations.push(
      sentiment === 'positive'
        ? `Continue current preparation methods`
        : `Verify quality meets standards`
    );
  }

  return [...warnings, ...recommendations];
}

function getDefaultAnalysis(context, isError = false) {
  const base = {
    sentiment: 'neutral',
    emotion: 'neutral',
    analyzedAt: new Date(),
    analysisContext: context
  };

  if (context === 'user preferences') {
    return {
      ...base,
      summary: isError ? 'Analysis unavailable' : 'No substantive feedback provided',
      keywords: [],
      recommendations: ['Insufficient data to analyze user preferences']
    };
  }

  return {
    ...base,
    summary: isError ? 'Analysis unavailable' : 'No substantive feedback provided',
    keywords: [],
    recommendations: [`Prepare ${context} with standard care`]
  };
}

function getDefaultUserAnalysis() {
  return {
    summary: "No previous feedback available for this customer",
    recommendations: ["Standard preparation recommended"],
    sentiment: "neutral",
    emotion: "neutral",
    averageRating: 0,
    positiveCount: 0,
    negativeCount: 0,
    preferredItems: [],
    dislikedItems: [],
    categoryAnalysis: [],
    dietaryPreferences: [],
    ratingTrend: "unknown"
  };
}

module.exports = { 
  analyzeFeedback,
  analyzeUserFeedbackHistory 
};