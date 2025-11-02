# Quick Start Guide

Get the Telegram Vocabulary Trainer up and running in 5 minutes!

## Prerequisites

- Docker and Docker Compose installed
- Telegram Bot Token (from @BotFather)

## 1. Clone and Setup

```bash
cd translate
cp .env.example .env
```

Edit `.env` and add your Telegram bot token:
```env
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE
```

## 2. Start Services

```bash
docker-compose up -d
```

Wait about 30 seconds for all services to start.

## 3. Verify Services

```bash
# Check logs
docker-compose logs

# Check status
docker-compose ps
```

You should see 4 services running:
- db (PostgreSQL)
- backend (NestJS API)
- bot (Telegram bot)
- web (React app)

## 4. Test the System

### Test Backend API:
```bash
curl http://localhost:5005/words/categories
```

Expected response:
```json
{"categories":["work","family","food","time"]}
```

### Test Bot:
1. Open Telegram and find your bot
2. Send `/start`
3. You should see the menu with options

### Test WebApp:
Open http://localhost:5173 in a browser (or use Telegram WebApp)

## 5. First User Experience

1. In Telegram, click "Start test now"
2. Answer 10 vocabulary questions
3. View your results
4. Check the leaderboard

## Common Issues

### "Connection refused" errors
Services might still be starting. Wait 30 seconds and try again.

### Bot not responding
- Check bot token in `.env`
- View logs: `docker-compose logs bot`
- Verify bot is running: `docker-compose ps`

### Database errors
- Check PostgreSQL is running: `docker-compose ps db`
- View database logs: `docker-compose logs db`

### WebApp not loading
- Check backend is running: `docker-compose logs backend`
- Verify all services: `docker-compose ps`

## Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f bot
```

## Stopping Services

```bash
docker-compose down
```

To remove all data:
```bash
docker-compose down -v
```

## Next Steps

- Add more words to `words/words.json`
- Customize categories
- Deploy to a production server (see README.md)
- Set up SSL with Let's Encrypt

## Need Help?

- Check README.md for detailed documentation
- View API docs at http://localhost:5005/api
- Check service logs for errors

---

Happy learning! 📚

