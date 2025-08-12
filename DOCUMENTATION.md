# r/Comcast_Xfinity Product Intelligence Platform

**Transform customer feedback into breakthrough product opportunities with AI-powered analysis**

---

## Overview

The r/Comcast_Xfinity Product Intelligence Platform is an enterprise-grade analytics tool that transforms raw customer feedback from Reddit into actionable product insights. Built with dual analysis modes, it serves both traditional feedback analysis and advanced product opportunity mining needs.

### Key Capabilities

- **🔍 Standard Analysis Mode**: Traditional customer feedback analysis with sentiment tracking and issue categorization
- **🚀 Product Manager Mode**: Advanced opportunity mining that transforms customer pain into strategic product concepts
- **📊 Real-time Data Collection**: Automated Reddit data collection every hour with AI-powered analysis
- **💬 Interactive Chat Interface**: Natural language queries with contextual AI responses
- **📈 Analytics Dashboard**: Trend visualization and keyword tracking

---

## Quick Start

### Prerequisites

- Node.js 18 or higher
- OpenAI API key
- Git (for development)

### Installation

```bash
# Clone the repository
git clone https://github.com/kellyoconor/reddit-chat-beta2.git
cd reddit-chat-beta2

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your OpenAI API key
```

### Configuration

Create a `.env` file in the root directory:

```env
# Required
OPENAI_API_KEY=sk-your-openai-api-key

# Optional
PORT=3000
NODE_ENV=production
```

### Running the Application

```bash
# Start the application
npm start

# The application will be available at http://localhost:3000
```

---

## Analysis Modes

### Standard Analysis Mode

Traditional customer feedback analysis designed for support teams and customer experience professionals.

**Features:**
- Issue categorization and sentiment analysis
- Customer pain point identification
- Trend analysis and pattern recognition
- Quantitative metrics and summaries

**Use Cases:**
- Support team insights
- Customer satisfaction monitoring
- Issue trend identification
- Executive reporting

**Sample Query:**
```
"What are the main billing complaints this week?"
```

**Sample Response:**
```
📊 QUICK SUMMARY
- Total Posts Analyzed: 52
- Main Issues: Billing confusion, service outages, equipment problems
- Sentiment: 15 negative, 8 neutral, 29 positive

🔥 TOP ISSUES FOUND
1. Billing Confusion - Customers struggling with charges
   - 12 customers affected
   - "I don't understand these fees on my bill"
```

### Product Manager Mode

Advanced opportunity mining designed for product teams and strategic planning.

**Features:**
- Deep pattern recognition using Jobs-to-be-Done framework
- Hidden customer need identification
- Market white space analysis
- Solution hypothesis generation
- Business impact assessment

**Use Cases:**
- Product roadmap planning
- Innovation opportunity identification
- Competitive analysis
- Strategic product decisions

**Sample Query:**
```
"What product opportunities do you see?"
```

**Sample Response:**
```
🎯 KEY INSIGHTS SUMMARY
Customers are creating workarounds for network visibility issues, suggesting a major opportunity in proactive network management tools.

🔍 TOP OPPORTUNITY AREAS
Opportunity 1: Proactive Network Health Monitoring
- Customer job-to-be-done: Avoid service interruptions during important activities
- Current gap: Reactive support model creates frustration
- Business impact potential: High

💡 SOLUTION HYPOTHESES
Hypothesis: "What if customers could see their network health in real-time like a health app?"
- Core concept: Netflix-style dashboard showing network performance predictions
- Technology enablers: AI-powered predictive analytics, IoT sensors
- Success metrics: 50% reduction in support calls, 20-point NPS increase
- Implementation complexity: Medium
```

---

## API Reference

### Chat Endpoint

Send natural language queries to analyze customer feedback.

**Endpoint:** `POST /api/chat`

**Request Body:**
```json
{
  "message": "What are the main customer issues?"
}
```

**Response:**
```json
{
  "response": "Formatted analysis response",
  "source": "r/Comcast_Xfinity (AI Analysis)",
  "postsAnalyzed": 52
}
```

**Mode Selection:**
The system automatically detects analysis mode based on query keywords or explicit mode selection in the UI.

**PM Mode Keywords:**
- `opportunities`
- `product manager`
- `gaps`
- `unmet needs`
- `what if`
- `hypothesis`

### Analytics Endpoints

#### Get Analytics Summary

**Endpoint:** `GET /api/analytics-summary?days={number}`

**Parameters:**
- `days`: Number of days to analyze (1, 3, 7, 30)

**Response:**
```json
{
  "summary": {
    "totalPosts": 125,
    "problemPosts": 45,
    "problemRate": 36,
    "sentiment": {
      "positive": 60,
      "neutral": 35,
      "negative": 30
    }
  },
  "topKeywords": [
    {"keyword": "billing", "count": 23},
    {"keyword": "outage", "count": 18}
  ]
}
```

#### Get Keyword Trends

**Endpoint:** `GET /api/keyword-trends/{keyword}?days={number}`

**Parameters:**
- `keyword`: Specific keyword to track
- `days`: Time period for trend analysis

---

## Data Architecture

### Data Collection

The platform automatically collects data from r/Comcast_Xfinity every hour:

- **Volume**: 25 new posts per collection cycle
- **Sources**: Hot posts, new posts, and trending discussions
- **Processing**: Real-time sentiment analysis and keyword extraction
- **Storage**: SQLite database with full post metadata

### Data Processing Pipeline

1. **Collection**: Reddit API fetch with rate limiting
2. **Analysis**: OpenAI-powered sentiment and urgency scoring
3. **Storage**: Structured data storage with timestamps
4. **Indexing**: Keyword extraction and trend tracking
5. **Querying**: Real-time analysis for chat responses

### Database Schema

#### Posts Table
```sql
CREATE TABLE posts (
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
);
```

#### Keyword Trends Table
```sql
CREATE TABLE keyword_trends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT NOT NULL,
    count INTEGER,
    date TEXT,
    hour INTEGER,
    UNIQUE(keyword, date, hour)
);
```

---

## Deployment

### Docker Deployment

The application includes Docker configuration for easy deployment:

```bash
# Build the container
docker build -t reddit-analytics .

# Run with environment variables
docker run -d \
  -p 3000:3000 \
  -e OPENAI_API_KEY=your_key_here \
  -v $(pwd)/data:/app/data \
  --name reddit-analytics \
  reddit-analytics
```

### Docker Compose

```bash
# Set your API key
export OPENAI_API_KEY=your_key_here

# Start all services
docker-compose up -d
```

### Cloud Platform Deployment

#### Heroku

```bash
# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set OPENAI_API_KEY=your_key_here

# Deploy
git push heroku main
```

#### Railway

1. Connect your GitHub repository
2. Set `OPENAI_API_KEY` environment variable
3. Deploy automatically on git push

#### DigitalOcean App Platform

1. Connect GitHub repository in DigitalOcean
2. Configure environment variables
3. Enable auto-deployment from main branch

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | - | OpenAI API key for AI analysis |
| `PORT` | No | 3000 | Server port |
| `NODE_ENV` | No | development | Environment mode |

### Application Settings

The application can be configured through the web interface:

- **Analysis Mode**: Toggle between Standard and Product Manager modes
- **Time Periods**: Analyze data from 1 day to 30 days
- **Keyword Tracking**: Monitor specific terms and trends

---

## Advanced Features

### Product Manager Mode Deep Dive

The Product Manager mode uses a sophisticated analysis framework:

#### Step 1: Deep Pattern Recognition
- **Jobs-to-be-Done Analysis**: Understanding core customer objectives
- **Friction Mapping**: Identifying highest-friction moments
- **Outcome Gaps**: Finding unmet customer desired outcomes

#### Step 2: Opportunity Mining
- **Hidden Customer Needs**: Beyond surface complaints
- **Market White Spaces**: Adjacent problem opportunities
- **High-Leverage Interventions**: Maximum impact changes

#### Step 3: Solution Hypothesis Generation
- **AI-Powered Innovations**: Machine learning applications
- **Experience Reimagination**: Complete user journey rethinking
- **Platform Opportunities**: Ecosystem-level solutions
- **Proactive Service Models**: Prevention over reaction

### Quality Controls

The system includes built-in quality controls:

- **10x vs 10% Thinking**: Prioritizes breakthrough over incremental
- **Testability Requirements**: All hypotheses must be measurable
- **Technical Feasibility**: Considers implementation complexity
- **Business Impact**: Assesses potential market opportunity

---

## Troubleshooting

### Common Issues

#### Authentication Errors
```
Error: 401 Incorrect API key provided
```
**Solution**: Verify your OpenAI API key is correctly set in the `.env` file.

#### Port Conflicts
```
Error: listen EADDRINUSE :::3000
```
**Solution**: Change the PORT in your `.env` file or kill existing processes:
```bash
pkill -f "node server.js"
```

#### Database Issues
**Solution**: Reset the database by deleting `reddit_analytics.db` and restarting:
```bash
rm reddit_analytics.db
npm start
```

#### Memory Issues
**Solution**: For high-volume usage, increase Node.js memory limit:
```bash
node --max-old-space-size=4096 server.js
```

### Debugging

Enable detailed logging:
```bash
NODE_ENV=development npm start
```

Check application logs:
```bash
# Docker
docker-compose logs -f

# Local
npm start | tee logs.txt
```

---

## Performance & Scaling

### Current Limits

- **Data Collection**: 25 posts per hour (600 posts/day)
- **API Calls**: Rate-limited by OpenAI quota
- **Storage**: SQLite suitable for < 100K posts
- **Concurrent Users**: Designed for < 100 simultaneous users

### Scaling Considerations

For high-volume usage:

1. **Database**: Migrate to PostgreSQL for better concurrent access
2. **Caching**: Add Redis for API response caching
3. **Load Balancing**: Use multiple application instances
4. **API Limits**: Implement request queuing for OpenAI calls

---

## Security

### Best Practices

- **API Keys**: Never commit API keys to version control
- **Environment Variables**: Use secure environment variable management
- **HTTPS**: Always use HTTPS in production
- **Input Validation**: All user inputs are sanitized
- **Rate Limiting**: Built-in protection against abuse

### Compliance

- **Data Privacy**: No personal customer data is stored
- **GDPR**: All data is anonymized Reddit posts
- **SOC 2**: Compatible with enterprise security requirements

---

## Contributing

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/your-username/reddit-chat-beta2.git

# Create a feature branch
git checkout -b feature/your-feature-name

# Make changes and test
npm start

# Commit and push
git commit -m "Add your feature"
git push origin feature/your-feature-name
```

### Code Standards

- **ES6+**: Modern JavaScript features
- **Async/Await**: For asynchronous operations
- **Error Handling**: Comprehensive try-catch blocks
- **Documentation**: Inline comments for complex logic

### Testing

```bash
# Run basic health check
curl http://localhost:3000

# Test API endpoint
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test query"}'
```

---

## Support

### Documentation
- **GitHub Repository**: [reddit-chat-beta2](https://github.com/kellyoconor/reddit-chat-beta2)
- **Issues**: Report bugs and feature requests on GitHub
- **Discussions**: Community support and questions

### Commercial Support
For enterprise deployments and custom development, contact the development team through GitHub issues.

---

## License

ISC License - see LICENSE file for details.

---

## Changelog

### v2.0.0 - Product Manager Mode
- ✨ Added dual analysis modes (Standard + PM)
- 🚀 Advanced opportunity mining capabilities
- 🎨 Dynamic UI with mode-aware messaging
- 📊 Enhanced analytics and business impact assessment

### v1.0.0 - Initial Release
- 🔍 Basic Reddit data collection and analysis
- 💬 Interactive chat interface
- 📈 Analytics dashboard
- 🐳 Docker deployment support

---

*Built with ❤️ for product teams who want to transform customer feedback into breakthrough opportunities*
