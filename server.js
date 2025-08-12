require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const OpenAI = require('openai');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Initialize SQLite database
const db = new sqlite3.Database('./reddit_analytics.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('📊 Connected to SQLite database');
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.run(`CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        score INTEGER,
        upvote_ratio REAL,
        comments INTEGER,
        author TEXT,
        created_utc INTEGER,
        created_iso TEXT,
        url TEXT,
        flair TEXT,
        is_problem_report BOOLEAN,
        sentiment TEXT,
        urgency_level INTEGER,
        keywords TEXT,
        collected_at INTEGER DEFAULT (strftime('%s', 'now'))
    )`, (err) => {
        if (err) {
            console.error('Error creating posts table:', err);
        } else {
            console.log('✅ Posts table ready');
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS keyword_trends (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        keyword TEXT NOT NULL,
        count INTEGER,
        date TEXT,
        hour INTEGER,
        UNIQUE(keyword, date, hour)
    )`, (err) => {
        if (err) {
            console.error('Error creating keyword_trends table:', err);
        } else {
            console.log('✅ Keyword trends table ready');
        }
    });
}

async function getRedditPosts(timeframe = 'week', sortBy = 'hot', limit = 50) {
    try {
        // Fetch from multiple sorting methods for comprehensive data
        const endpoints = [
            `https://www.reddit.com/r/Comcast_Xfinity/${sortBy}.json?limit=${limit}&t=${timeframe}`,
            `https://www.reddit.com/r/Comcast_Xfinity/new.json?limit=25`, // Always get some recent posts
        ];
        
        const allPosts = [];
        
        for (const endpoint of endpoints) {
            const response = await fetch(endpoint, {
                headers: { 'User-Agent': 'XfinityInsights/2.0 (by /u/ComcastFeedbackBot)' }
            });
            const data = await response.json();
            
            if (data?.data?.children) {
                allPosts.push(...data.data.children);
            }
        }
        
        // Remove duplicates and enhance data
        const uniquePosts = Array.from(new Map(allPosts.map(post => [post.data.id, post])).values());
        
        return uniquePosts.map(post => {
            const postData = post.data;
            const createdDate = new Date(postData.created_utc * 1000);
            
            return {
                id: postData.id,
                title: postData.title,
                content: postData.selftext || '', // Get full content, not truncated
                score: postData.score,
                upvoteRatio: postData.upvote_ratio,
                comments: postData.num_comments,
                author: postData.author,
                created: createdDate.toISOString(),
                createdRelative: getRelativeTime(createdDate),
                url: `https://reddit.com${postData.permalink}`,
                flair: postData.link_flair_text || '',
                isStickied: postData.stickied,
                isLocked: postData.locked,
                gilded: postData.gilded,
                domain: postData.domain,
                // Categorization hints
                isProblemReport: isProblemPost(postData.title, postData.selftext),
                sentiment: getSentimentHint(postData.title, postData.selftext),
                urgencyLevel: getUrgencyLevel(postData.title, postData.selftext, postData.score, postData.num_comments)
            };
                 }).sort((a, b) => {
             // Sort by urgency/importance for analysis
             if (a.urgencyLevel !== b.urgencyLevel) return b.urgencyLevel - a.urgencyLevel;
             return b.score - a.score;
         });
         
         // Save posts to database for historical tracking
         console.log(`📁 Saving ${processedPosts.length} posts to database...`);
         processedPosts.forEach(post => {
             savePostToDatabase(post);
         });
         
         return processedPosts;
    } catch (error) {
        console.error('Reddit API error:', error);
        return [];
    }
}

function getRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Less than an hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return `${Math.floor(diffDays / 7)} weeks ago`;
}

function isProblemPost(title, content) {
    const problemKeywords = [
        'outage', 'down', 'not working', 'broken', 'issue', 'problem', 
        'slow', 'buffering', 'disconnected', 'billing error', 'overcharged',
        'technician', 'appointment', 'cancel', 'refund', 'complaint'
    ];
    const text = (title + ' ' + content).toLowerCase();
    return problemKeywords.some(keyword => text.includes(keyword));
}

function getSentimentHint(title, content) {
    const negative = ['angry', 'frustrated', 'terrible', 'worst', 'hate', 'awful', 'scam', 'rip off'];
    const positive = ['great', 'excellent', 'amazing', 'love', 'perfect', 'fantastic', 'recommend'];
    const text = (title + ' ' + content).toLowerCase();
    
    const negativeCount = negative.filter(word => text.includes(word)).length;
    const positiveCount = positive.filter(word => text.includes(word)).length;
    
    if (negativeCount > positiveCount) return 'negative';
    if (positiveCount > negativeCount) return 'positive';
    return 'neutral';
}

function getUrgencyLevel(title, content, score, comments) {
    const text = (title + ' ' + content).toLowerCase();
    const urgentKeywords = ['emergency', 'urgent', 'asap', 'immediately', 'critical', 'outage'];
    
    let urgency = 1;
    if (urgentKeywords.some(keyword => text.includes(keyword))) urgency += 3;
    if (score > 50) urgency += 2;
    if (comments > 20) urgency += 1;
    if (text.includes('hours') || text.includes('days')) urgency += 1;
    
    return Math.min(urgency, 5);
}

// Database functions for historical tracking
function savePostToDatabase(post) {
    console.log('💾 Saving post to database:', post.id, post.title?.substring(0, 50));
    
    const keywords = extractKeywords(post.title, post.content);
    
    const stmt = db.prepare(`INSERT OR REPLACE INTO posts 
        (id, title, content, score, upvote_ratio, comments, author, created_utc, created_iso, 
         url, flair, is_problem_report, sentiment, urgency_level, keywords) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
    const createdUtc = new Date(post.created).getTime() / 1000;
    
    stmt.run([
        post.id,
        post.title,
        post.content,
        post.score,
        post.upvoteRatio,
        post.comments,
        post.author,
        createdUtc,
        post.created,
        post.url,
        post.flair,
        post.isProblemReport ? 1 : 0,
        post.sentiment,
        post.urgencyLevel,
        keywords.join(',')
    ], (err) => {
        if (err) {
            console.error('❌ Error saving post:', post.id, err.message);
        } else {
            console.log('✅ Saved post:', post.id);
        }
    });
    
    stmt.finalize();
    
    // Update keyword trends
    updateKeywordTrends(keywords);
}

function extractKeywords(title, content) {
    const text = (title + ' ' + content).toLowerCase();
    const keywords = [];
    
    // Service-related keywords
    const serviceKeywords = [
        'internet', 'wifi', 'slow', 'speed', 'outage', 'down', 'billing', 
        'bill', 'charge', 'payment', 'technician', 'appointment', 'cable',
        'tv', 'modem', 'router', 'customer service', 'support'
    ];
    
    serviceKeywords.forEach(keyword => {
        if (text.includes(keyword)) {
            keywords.push(keyword);
        }
    });
    
    return keywords;
}

function updateKeywordTrends(keywords) {
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const hour = now.getHours();
    
    keywords.forEach(keyword => {
        db.run(`INSERT OR IGNORE INTO keyword_trends (keyword, count, date, hour) VALUES (?, 0, ?, ?)`, 
               [keyword, date, hour]);
        db.run(`UPDATE keyword_trends SET count = count + 1 WHERE keyword = ? AND date = ? AND hour = ?`, 
               [keyword, date, hour]);
    });
}

function getHistoricalPosts(startDate, endDate, callback) {
    const query = `
        SELECT * FROM posts 
        WHERE created_iso BETWEEN ? AND ? 
        ORDER BY created_utc DESC
    `;
    
    db.all(query, [startDate, endDate], (err, rows) => {
        if (err) {
            callback(err, null);
        } else {
            // Convert back to our post format
            const posts = rows.map(row => ({
                id: row.id,
                title: row.title,
                content: row.content,
                score: row.score,
                upvoteRatio: row.upvote_ratio,
                comments: row.comments,
                author: row.author,
                created: row.created_iso,
                createdRelative: getRelativeTime(new Date(row.created_iso)),
                url: row.url,
                flair: row.flair,
                isProblemReport: row.is_problem_report === 1,
                sentiment: row.sentiment,
                urgencyLevel: row.urgency_level
            }));
            callback(null, posts);
        }
    });
}

function getKeywordTrends(keyword, days = 7, callback) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    const query = `
        SELECT date, hour, SUM(count) as total_count
        FROM keyword_trends 
        WHERE keyword = ? AND date >= ?
        GROUP BY date, hour
        ORDER BY date, hour
    `;
    
    db.all(query, [keyword, startDateStr], callback);
}

function isThemeAnalysisQuery(message) {
    const lowerMessage = message.toLowerCase();
    return lowerMessage.includes('theme') || 
           lowerMessage.includes('topic') || 
           lowerMessage.includes('top ') || 
           lowerMessage.includes('main') ||
           lowerMessage.includes('common') ||
           lowerMessage.includes('trending') ||
           lowerMessage.includes('patterns') ||
           lowerMessage.includes('categories');
}

app.post('/api/chat', async (req, res) => {
    try {
        const posts = await getRedditPosts();
        
        if (posts.length === 0) {
            return res.json({
                response: "I couldn't fetch recent posts from r/Comcast_Xfinity. Please try again.",
                source: 'r/Comcast_Xfinity'
            });
        }

        let prompt;
        
        if (isThemeAnalysisQuery(req.body.message)) {
            // Count various metrics for executive insights
            const problemPosts = posts.filter(p => p.isProblemReport).length;
            const highUrgencyPosts = posts.filter(p => p.urgencyLevel >= 4).length;
            const sentimentDistribution = posts.reduce((acc, p) => {
                acc[p.sentiment] = (acc[p.sentiment] || 0) + 1;
                return acc;
            }, {});

            prompt = `You are a senior business analyst providing C-level executives with actionable insights from Comcast Xfinity customer feedback. 

CONTEXT:
- Total posts analyzed: ${posts.length}
- Problem reports: ${problemPosts} (${Math.round(problemPosts/posts.length*100)}%)
- High-urgency issues: ${highUrgencyPosts}
- Sentiment: ${sentimentDistribution.negative || 0} negative, ${sentimentDistribution.neutral || 0} neutral, ${sentimentDistribution.positive || 0} positive

USER QUERY: "${req.body.message}"

POSTS DATA: ${JSON.stringify(posts.slice(0, 25))}

Provide a clear, easy-to-read analysis with:

## 📊 QUICK SUMMARY
- **Total Posts Analyzed:** ${posts.length}
- **Main Issues:** List the top 3 customer concerns
- **Sentiment:** Overall customer mood (positive/negative/neutral)

## 🔥 TOP ISSUES FOUND
1. **[Issue Name]** - Brief description
   - How many customers affected
   - Sample customer quote
   
2. **[Issue Name]** - Brief description  
   - How many customers affected
   - Sample customer quote

3. **[Issue Name]** - Brief description
   - How many customers affected  
   - Sample customer quote

## 💡 KEY INSIGHTS
- What this means for customers
- Any patterns or trends noticed
- Recommendations in simple terms

Use clear headings, bullet points, and keep responses concise and scannable. Focus on being helpful and informative rather than overly technical.`;
        } else {
            prompt = `You are a helpful customer feedback analyst. Provide clear, easy-to-read insights about r/Comcast_Xfinity customer feedback.

CONTEXT: Analyzing ${posts.length} recent posts from r/Comcast_Xfinity
QUERY: "${req.body.message}"

ENHANCED POST DATA: ${JSON.stringify(posts.slice(0, 20))}

Provide detailed analysis including:
- Specific customer pain points with urgency levels
- Root cause analysis where possible
- Impact on customer retention/satisfaction
- Competitive implications
- Recommended immediate actions

Include direct post links and quote specific customer language to support findings.`;
        }
        
        const aiResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 600,
            temperature: 0.3
        });
        
        res.json({
            response: aiResponse.choices[0].message.content,
            source: 'r/Comcast_Xfinity (AI Analysis)',
            postsAnalyzed: posts.length
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Analysis failed: ' + error.message 
        });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'AI Reddit chat server is running' });
});

// Historical data endpoints
app.get('/api/historical', (req, res) => {
    const { startDate, endDate, keyword } = req.query;
    
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
    }
    
    getHistoricalPosts(startDate, endDate, (err, posts) => {
        if (err) {
            console.error('Historical data error:', err);
            return res.status(500).json({ error: 'Failed to fetch historical data' });
        }
        
        // Filter by keyword if provided
        let filteredPosts = posts;
        if (keyword) {
            filteredPosts = posts.filter(post => 
                post.title.toLowerCase().includes(keyword.toLowerCase()) ||
                post.content.toLowerCase().includes(keyword.toLowerCase())
            );
        }
        
        res.json({
            posts: filteredPosts,
            total: filteredPosts.length,
            dateRange: { startDate, endDate },
            keyword: keyword || null
        });
    });
});

app.get('/api/keyword-trends/:keyword', (req, res) => {
    const { keyword } = req.params;
    const { days = 7 } = req.query;
    
    getKeywordTrends(keyword, parseInt(days), (err, trends) => {
        if (err) {
            console.error('Keyword trends error:', err);
            return res.status(500).json({ error: 'Failed to fetch keyword trends' });
        }
        
        res.json({
            keyword,
            days: parseInt(days),
            trends
        });
    });
});

app.get('/api/analytics-summary', (req, res) => {
    const { days = 7 } = req.query;
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    getHistoricalPosts(startDate, endDate, (err, posts) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch analytics' });
        }
        
        // Calculate summary metrics
        const totalPosts = posts.length;
        const problemPosts = posts.filter(p => p.isProblemReport).length;
        const sentimentDistribution = posts.reduce((acc, p) => {
            acc[p.sentiment] = (acc[p.sentiment] || 0) + 1;
            return acc;
        }, { positive: 0, neutral: 0, negative: 0 });
        
        const topKeywords = {};
        posts.forEach(post => {
            const keywords = extractKeywords(post.title, post.content);
            keywords.forEach(keyword => {
                topKeywords[keyword] = (topKeywords[keyword] || 0) + 1;
            });
        });
        
        res.json({
            period: { days, startDate, endDate },
            summary: {
                totalPosts,
                problemPosts,
                problemRate: Math.round((problemPosts / totalPosts) * 100),
                sentiment: sentimentDistribution
            },
            topKeywords: Object.entries(topKeywords)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([keyword, count]) => ({ keyword, count }))
        });
    });
});

// Background data collection
function startBackgroundCollection() {
    console.log('🔄 Starting background data collection...');
    
    // Collect data immediately on startup
    collectAndStoreData();
    
    // Then collect every hour
    setInterval(collectAndStoreData, 60 * 60 * 1000); // 1 hour
}

async function collectAndStoreData() {
    try {
        console.log('📥 Collecting fresh Reddit data...');
        const posts = await getRedditPosts('day', 'new', 25);
        console.log(`✅ Collected and stored ${posts.length} posts`);
    } catch (error) {
        console.error('❌ Background collection failed:', error);
    }
}

app.listen(PORT, () => {
    console.log(`🤖 AI Reddit Chat running on http://localhost:${PORT}`);
    console.log('💬 Ready to analyze r/Comcast_Xfinity feedback with AI!');
    
    // Start background data collection
    setTimeout(startBackgroundCollection, 5000); // Wait 5 seconds after server start
});