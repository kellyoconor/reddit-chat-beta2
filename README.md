# Reddit Analytics App

A lightweight Reddit feedback analysis application for r/Comcast_Xfinity that uses AI to analyze posts and provide insights.

## Features

- 🤖 AI-powered sentiment analysis using OpenAI
- 📊 Real-time analytics dashboard
- 💬 Interactive chat interface
- 🔍 Keyword extraction and trending topics
- 📈 Problem report detection and urgency scoring
- ⏰ Background data collection every hour

## Prerequisites

- Node.js 18+ 
- OpenAI API key
- (Optional) Docker for containerized deployment

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:
- `OPENAI_API_KEY`: Your OpenAI API key

Optional variables:
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (default: development)

## Installation & Setup

### Local Development

1. Clone and install dependencies:
```bash
git clone <your-repo-url>
cd reddit-2
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your OpenAI API key
```

3. Start the application:
```bash
npm start
```

4. Open http://localhost:3000 in your browser

### Docker Deployment

1. Build and run with Docker Compose:
```bash
# Set your OpenAI API key
export OPENAI_API_KEY=your_actual_key_here

# Start the application
docker-compose up -d
```

2. View logs:
```bash
docker-compose logs -f
```

3. Stop the application:
```bash
docker-compose down
```

### Manual Docker

```bash
# Build the image
docker build -t reddit-analytics .

# Run the container
docker run -d \
  -p 3000:3000 \
  -e OPENAI_API_KEY=your_actual_key_here \
  -v $(pwd)/data:/app/data \
  --name reddit-analytics \
  reddit-analytics
```

## Cloud Deployment Options

### Heroku

1. Install Heroku CLI and login:
```bash
heroku login
```

2. Create and deploy:
```bash
heroku create your-app-name
heroku config:set OPENAI_API_KEY=your_actual_key_here
git push heroku main
```

### Railway

1. Connect your GitHub repo to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on git push

### DigitalOcean App Platform

1. Connect your GitHub repo
2. Configure environment variables
3. Deploy with auto-scaling

### AWS/Google Cloud

Use the provided Dockerfile with your preferred container service:
- AWS ECS/Fargate
- Google Cloud Run
- Azure Container Instances

## Usage

1. **Dashboard**: View real-time analytics and trends
2. **Chat Interface**: Ask questions about Reddit data
3. **Background Collection**: Data is automatically collected every hour
4. **API Endpoints**: Access data programmatically

## API Endpoints

- `GET /` - Main dashboard
- `GET /api/posts` - Get analyzed posts
- `POST /api/chat` - Chat with AI about data
- `GET /api/analytics` - Get analytics summary

## Database

The app uses SQLite for data storage. The database file (`reddit_analytics.db`) is created automatically and stores:
- Reddit posts with metadata
- Sentiment analysis results
- Keywords and trends
- Problem reports and urgency scores

## Development

### Project Structure
```
reddit-2/
├── server.js           # Main application server
├── public/
│   └── index.html     # Frontend dashboard
├── reddit_analytics.db # SQLite database
├── package.json       # Dependencies
├── Dockerfile         # Container configuration
├── docker-compose.yml # Multi-container setup
└── .env.example       # Environment template
```

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server

## Troubleshooting

### Common Issues

1. **OpenAI API errors**: Verify your API key is correct and has credits
2. **Port conflicts**: Change PORT in .env if 3000 is occupied
3. **Database issues**: Delete `reddit_analytics.db` to reset
4. **Memory issues**: Increase container memory limits if needed

### Logs

Check application logs:
```bash
# Docker
docker-compose logs -f

# Local
npm start
```

## License

ISC License

## Support

For issues and questions, please check the application logs and ensure all environment variables are properly configured.
