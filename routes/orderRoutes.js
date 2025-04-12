
 
const express = require("express");
//const orderController = require("../controllers/orderController");
const Order = require("../models/orderModel");
const axios = require("axios");
const FoodItem = require("../models/foodItem");
const natural = require('natural');
const { SentimentAnalyzer } = natural;
const analyzer = new SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');

const OPENROUTER_API_KEY = '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';
const YOUR_SITE_URL = 'http://localhost';
const YOUR_SITE_NAME = 'Local Test';
const router = express.Router();

// // Place a new order
// router.post("/", orderController.createOrder);

// // Get recent orders (for home screen)
// router.get("/recent", orderController.getRecentOrders);

// Enhanced AI Recommendation Engine with Full Feedback Analysis
async function generateChefRecommendation(userId, orderedItems) {
    try {
        // Get ALL feedback from this user across all food items with proper population
        const foodItemsWithFeedback = await FoodItem.find({
            'feedback.userId': userId
        })
        .populate({
            path: 'feedback.userId',
            select: 'firstName lastName',
            model: 'User'
        })
        .lean();

        // Extract and format all user feedback
        const allUserFeedback = foodItemsWithFeedback.flatMap(foodItem => 
            foodItem.feedback
                .filter(fb => fb.userId && fb.userId._id.toString() === userId.toString())
                .map(fb => ({
                    foodItem: foodItem.name,
                    comment: fb.comment || "No comment provided",
                    rating: fb.rating,
                    date: new Date(fb.createdAt).toLocaleDateString()
                }))
        );

        if (allUserFeedback.length === 0) {
            return {
                recommendation: "No previous feedback found from this customer. Prepare using standard recipes and presentation.",
                priority: "normal",
                sentiment: "neutral",
                feedbackHistory: []
            };
        }

        // Calculate rating statistics
        const ratings = allUserFeedback.map(fb => fb.rating);
        const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        const ratingVariance = Math.sqrt(ratings.map(r => Math.pow(r - avgRating, 2)).reduce((a, b) => a + b) / ratings.length);

        // Perform sentiment analysis
        const sentimentResults = allUserFeedback.map(fb => {
            const score = analyzer.getSentiment((fb.comment || "").split(' '));
            return {
                ...fb,
                sentimentScore: score,
                sentiment: score < -0.5 ? "negative" : score > 0.5 ? "positive" : "neutral"
            };
        });

        const avgSentimentScore = sentimentResults.reduce((sum, fb) => sum + fb.sentimentScore, 0) / sentimentResults.length;
        const overallSentiment = avgSentimentScore < -0.5 ? "negative" : avgSentimentScore > 0.5 ? "positive" : "neutral";

        // Prepare feedback summary for AI
        const feedbackSummary = allUserFeedback
            .map(fb => `Item: ${fb.foodItem}\nRating: ${fb.rating}/5\nComment: ${fb.comment}\nDate: ${fb.date}\n`)
            .join('\n');

        const orderedItemsList = orderedItems.map(item => 
            `${item.quantity}x ${item.foodItemId?.name || item.name}`
        ).join(', ');

        // Construct the AI prompt
        const prompt = `Analyze this customer's order history and provide cooking recommendations in 20 words:
        
CUSTOMER FEEDBACK HISTORY:
${feedbackSummary}

CURRENT ORDER ITEMS:
${orderedItemsList}

OVERALL SENTIMENT: ${overallSentiment}
AVERAGE RATING: ${avgRating.toFixed(1)}
RATING VARIANCE: ${ratingVariance.toFixed(2)}

Provide specific recommendations including:
1. Preparation adjustments
2. Cooking technique modifications
3. Presentation suggestions
4. Quality control measures`;

        // Call DeepSeek via OpenRouter
        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "deepseek/deepseek-r1:free",
                messages: [
                    {
                        role: "system",
                        content: "You are a professional chef analyzing customer feedback to provide specific cooking recommendations."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.6,
                max_tokens: 1000
            },
            {
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "HTTP-Referer": YOUR_SITE_URL,
                    "X-Title": YOUR_SITE_NAME,
                    "Content-Type": "application/json"
                },
                timeout: 10000
            }
        );

        if (!response?.data?.choices?.[0]?.message?.content) {
            throw new Error("Invalid AI response structure");
        }

        const aiResponse = response.data.choices[0].message.content;

        // Calculate priority based on historical ratings
        let priority = "normal";
        if (avgRating < 2.5 || ratingVariance > 1.5) priority = "high";
        else if (avgRating > 4.2 && ratingVariance < 0.5) priority = "low";

        return {
            recommendation: aiResponse,
            priority,
            sentiment: overallSentiment,
            analyzedAt: new Date(),
            historicalData: {
                averageRating: parseFloat(avgRating.toFixed(1)),
                ratingVariance: parseFloat(ratingVariance.toFixed(2)),
                totalFeedback: allUserFeedback.length,
                lastFeedbackDate: allUserFeedback[allUserFeedback.length - 1].date,
                sentimentDistribution: {
                    positive: sentimentResults.filter(fb => fb.sentiment === "positive").length,
                    neutral: sentimentResults.filter(fb => fb.sentiment === "neutral").length,
                    negative: sentimentResults.filter(fb => fb.sentiment === "negative").length
                }
            },
            feedbackSamples: sentimentResults.slice(0, 3)
        };

    } catch (error) {
        console.error("AI recommendation error:", error.response?.data || error.message);
        return {
            recommendation: "Standard preparation required. Check customer's past ratings for potential preferences.",
            priority: "normal",
            sentiment: "neutral",
            analyzedAt: new Date(),
            feedbackHistory: []
        };
    }
}

// Get orders for chef with comprehensive AI analysis
router.get("/chef", async (req, res) => {
    try {
        const { analyze } = req.query;
        const statusFilter = ["pending", "preparing"];

        // Fetch orders with full population
        let orders = await Order.find({ status: { $in: statusFilter } })
            .sort({ createdAt: 1 })
            .populate({
                path: "user",
                select: "firstName lastName role",
                model: "User"
            })
            .populate({
                path: "items.foodItemId",
                select: "name price description preparationTime",
                model: "FoodItem"
            })
            .lean();

        // Format order data
        orders = orders.map(order => {
            const orderNumber = order._id.toString().substring(18, 24).toUpperCase();
            const orderTime = new Date(order.createdAt);
            const now = new Date();
            const diffMinutes = Math.floor((now - orderTime) / (1000 * 60));
            
            return {
                ...order,
                orderNumber: `#${orderNumber}`,
                orderTime: `${Math.floor(diffMinutes/60)}h ${diffMinutes%60}m ago`,
                status: order.status.toUpperCase(),
                formattedItems: order.items.map(item => ({
                    name: item.foodItemId?.name || item.name,
                    quantity: item.quantity,
                    price: item.price || item.foodItemId?.price,
                    preparationTime: item.foodItemId?.preparationTime || 15,
                    specialInstructions: item.specialInstructions || ''
                })),
                customerName: order.user ? `${order.user.firstName} ${order.user.lastName}` : 'Guest'
            };
        });

        // Add AI analysis if requested
        if (analyze === "true") {
            orders = await Promise.all(orders.map(async (order) => {
                if (!order.user) {
                    return {
                        ...order,
                        analysis: {
                            recommendation: "Guest user - no feedback history available",
                            priority: "normal",
                            sentiment: "neutral"
                        }
                    };
                }

                const analysis = await generateChefRecommendation(
                    order.user._id, 
                    order.items
                );

                return {
                    ...order,
                    analysis
                };
            }));
        }

        res.status(200).json(orders);

    } catch (error) {
        console.error("Error in chef orders route:", error);
        res.status(500).json({
            message: "Failed to process orders",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Update order status
router.patch("/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ["pending", "preparing", "ready", "completed", "cancelled"];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status, updatedAt: new Date() },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json(order);
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({
            message: "Failed to update order",
            error: error.message,
        });
    }
});

module.exports = router;









  
// // PATCH /orders/:id/status
// router.patch('/:id/status', async (req, res) => {
//   try {
//     const { status } = req.body;
//     const validStatuses = ['pending', 'preparing', 'ready', 'completed'];

//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({ message: 'Invalid status value' });
//     }

//     const order = await Order.findByIdAndUpdate(
//       req.params.id,
//       { status, updatedAt: new Date() },
//       { new: true }
//     );

//     if (!order) {
//       return res.status(404).json({ message: 'Order not found' });
//     }

//     res.status(200).json(order);
//   } catch (error) {
//     console.error('Error updating order status:', error);
//     res.status(500).json({ message: 'Failed to update order', error: error.message });
//   }
// });

 


// module.exports = router;
