# Telegram Vocabulary Trainer

A complete Telegram bot + Mini App system for learning English-Uzbek vocabulary. Built with NestJS backend, Telegraf bot, React WebApp, and PostgreSQL.

## Features

- 📚 **Interactive Learning**: Study words with examples and translations
- ✍️ **Practice Tests**: Test your vocabulary with automated questions
- 🏆 **Leaderboard**: Compete with others and track your progress
- 📊 **Progress Tracking**: Spaced repetition system for effective learning
- 🤖 **Telegram Bot**: Start tests directly in Telegram
- 📱 **Telegram Mini App**: Full-featured web interface in Telegram

## Tech Stack

### Backend
- **Framework**: NestJS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens
- **API Documentation**: Swagger/OpenAPI

### Bot
- **Framework**: Telegraf
- **Language**: TypeScript

### WebApp
- **Framework**: React + TypeScript
- **Build Tool**: Vite
- **Telegram Integration**: WebApp SDK

### Deployment
- **Containerization**: Docker + docker-compose
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt/Certbot

## Project Structure

```
translate/
├── backend/          # NestJS API
│   ├── src/
│   │   ├── auth/     # Authentication
│   │   ├── users/    # User management
│   │   ├── words/    # Word vocabulary service
│   │   ├── study/    # Study session logic
│   │   ├── tests/    # Test management
│   │   ├── leaderboard/  # Leaderboard stats
│   │   └── prisma/   # Prisma client
│   └── prisma/       # Database schema
├── bot/              # Telegram bot
│   └── src/
│       └── index.ts  # Bot logic
├── web/              # React Mini App
│   ├── src/
│   │   ├── components/
│   │   │   ├── LearnTab.tsx
│   │   │   ├── TestTab.tsx
│   │   │   └── LeaderboardTab.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   └── App.tsx
│   └── Dockerfile
├── words/            # Vocabulary data
│   └── words.json    # Static word database
├── docker/           # Nginx configs
│   └── nginx/
│       └── nginx.conf
├── docker-compose.yml
├── .env.example
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16+ (if running locally)
- Telegram Bot Token (from @BotFather)

### Local Development

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd translate
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env and add your credentials
   ```

3. **Start with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

   This will:
   - Start PostgreSQL database
   - Build and start the backend API
   - Build and start the Telegram bot
   - Build and start the React web app

4. **Access services**:
   - Backend API: http://localhost:5005
   - Swagger Docs: http://localhost:5005/api
   - WebApp: http://localhost:5173

### Manual Setup (Without Docker)

#### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

#### Bot

```bash
cd bot
npm install
npm run dev
```

#### WebApp

```bash
cd web
npm install
npm run dev
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=vocab_user
POSTGRES_PASSWORD=vocab_pass
POSTGRES_DB=vocab_db

# Backend
BACKEND_PORT=5005
BACKEND_JWT_SECRET=your-secret-key

# Telegram
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_WEBAPP_SECRET=your-webapp-secret
PUBLIC_BASE_URL=http://localhost:5005

# Common
NODE_ENV=development
```

### Database Setup

The database schema is managed by Prisma. To create tables:

```bash
cd backend
npx prisma migrate dev --name init
```

To view the database:

```bash
npx prisma studio
```

### Words Data

The vocabulary is stored in `words/words.json`. To add more words:

```json
[
  {
    "id": 11,
    "category": "food",
    "english": "apple",
    "uzbek": "olma",
    "example_en": "I eat an apple every day.",
    "example_uz": "Men har kuni olma yeyman."
  }
]
```

**Important**: After updating `words.json`, restart the backend service to reload words into memory.

## Deployment to Ubuntu Server

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
sudo apt-get install docker-compose-plugin -y

# Install Nginx (if using as reverse proxy)
sudo apt install nginx -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Clone and Configure

```bash
# Clone repository
git clone <your-repo-url> /var/www/vocab-trainer
cd /var/www/vocab-trainer

# Copy and edit environment variables
cp .env.example .env
nano .env  # Edit with your production values
```

### 3. Build and Start Services

```bash
# Build and start with docker-compose
docker-compose build
docker-compose up -d

# Check logs
docker-compose logs -f
```

### 4. Set up Nginx (Optional)

```bash
# Copy nginx config
sudo cp docker/nginx/nginx.conf /etc/nginx/sites-available/vocab-trainer

# Edit config with your domain
sudo nano /etc/nginx/sites-available/vocab-trainer

# Enable site
sudo ln -s /etc/nginx/sites-available/vocab-trainer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL Certificate

```bash
# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 6. Telegram Bot Webhook

```bash
# Set webhook (replace with your domain and token)
curl -F "url=https://yourdomain.com/bot/webhook/YOUR_BOT_TOKEN" \
  https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook

# Verify webhook
curl https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo
```

### 7. Monitor and Maintain

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Update application
git pull
docker-compose build
docker-compose up -d

# Backup database
docker-compose exec db pg_dump -U vocab_user vocab_db > backup.sql

# Restore database
docker-compose exec -T db psql -U vocab_user vocab_db < backup.sql
```

## API Endpoints

### Authentication
- `POST /auth/telegram` - Authenticate with Telegram WebApp
- `POST /auth/bot` - Authenticate Telegram bot user
- `GET /auth/me` - Get current user info

### Words
- `GET /words/categories` - Get all categories
- `GET /words` - Get all words
- `GET /words/category/:category` - Get words by category

### Study
- `GET /study/today?limit=10` - Get today's words to study

### Tests
- `POST /tests/start` - Start a new test
- `POST /tests/:id/answer` - Submit an answer
- `POST /tests/:id/finish` - Finish a test

### Leaderboard
- `GET /leaderboard?range=week` - Get leaderboard

### Users
- `GET /users/me` - Get user profile
- `PUT /users/settings` - Update user settings

**Full API documentation**: http://localhost:5005/api

## Bot Commands

- `/start` - Start the bot and show menu
- **Open Mini App** - Launch the React WebApp
- **Start test now** - Begin a quick vocabulary test
- **My stats** - View your statistics

## Database Schema

### users
- User information from Telegram

### user_settings
- Preferred category, direction (en_to_uz/uz_to_en/mixed), daily words limit

### user_words
- Tracking of word progress with spaced repetition

### tests
- Test sessions with scores

### test_questions
- Individual questions and answers

### daily_stats
- Daily learning statistics

## Development

### Running Tests

```bash
cd backend
npm run test
```

### Database Migrations

```bash
cd backend
npx prisma migrate dev --name migration-name
npx prisma migrate deploy  # For production
```

### Code Formatting

```bash
# Backend
cd backend
npm run format

# WebApp
cd web
npm run lint
```

## Troubleshooting

### Backend won't start
- Check database connection in `.env`
- Ensure Prisma migrations are applied
- Check logs: `docker-compose logs backend`

### Bot not responding
- Verify `TELEGRAM_BOT_TOKEN` in `.env`
- Check bot logs: `docker-compose logs bot`
- For webhook issues, verify webhook URL

### WebApp not loading
- Check `PUBLIC_BASE_URL` configuration
- Verify Telegram WebApp configuration
- Check browser console for errors

### Database errors
- Ensure PostgreSQL is running
- Check Prisma schema is synced: `npx prisma db push`
- Verify DATABASE_URL in `.env`

## Future Improvements

- [ ] Add more languages beyond English-Uzbek
- [ ] Implement audio pronunciation
- [ ] Add flashcards mode
- [ ] Social features (share progress, challenges)
- [ ] Mobile app versions
- [ ] AI-powered word recommendations
- [ ] Offline mode support

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - feel free to use this project for your own needs.

## Support

For issues and questions:
- Open an issue on GitHub
- Contact: [your-email]

## Acknowledgments

- Vocabulary data: Custom English-Uzbek dictionary
- Built with [NestJS](https://nestjs.com/), [Telegraf](https://telegraf.js.org/), [React](https://react.dev/)

---

**Note**: For production deployment, ensure all secrets are properly secured and HTTPS is configured.

