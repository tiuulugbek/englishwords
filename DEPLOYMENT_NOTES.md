# Deployment Notes

## Important Pre-Deployment Steps

### 1. Environment Variables

Before deploying, ensure your `.env` file has all required values:

```env
# REQUIRED: Get from @BotFather on Telegram
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# REQUIRED: Generate a secure random string
BACKEND_JWT_SECRET=your-very-secure-random-secret-key-min-32-chars

# REQUIRED for production: Your domain
PUBLIC_BASE_URL=https://yourdomain.com
```

### 2. Database Setup

The database will be automatically created on first run. To manually verify:

```bash
docker-compose exec db psql -U vocab_user -d vocab_db -c "\dt"
```

### 3. Prisma Migrations

First run will execute:
```bash
npx prisma migrate deploy
```

This creates all tables automatically. If you need to reset:
```bash
docker-compose down -v  # WARNING: Deletes all data
docker-compose up -d
```

### 4. Telegram Configuration

#### Create Bot
1. Message @BotFather on Telegram
2. Send `/newbot`
3. Follow instructions
4. Copy the token

#### Webhook Setup (Production)
```bash
curl -F "url=https://yourdomain.com/bot/webhook/YOUR_BOT_TOKEN" \
  https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook

# Verify
curl https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo
```

#### WebApp Setup
1. In @BotFather, use `/newapp`
2. Select your bot
3. Upload an app icon
4. Set Short Name
5. Set Description
6. Provide WebApp URL: `https://yourdomain.com`

### 5. SSL/HTTPS Setup

For production, SSL is mandatory. Use Let's Encrypt:

```bash
sudo certbot --nginx -d yourdomain.com
```

Certbot will:
- Install SSL certificate
- Configure Nginx
- Set up auto-renewal

### 6. Firewall Configuration

Allow required ports:
```bash
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 7. Monitoring

#### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f bot
docker-compose logs -f web
docker-compose logs -f db
```

#### Health Checks
```bash
# Backend
curl http://localhost:5005/words/categories

# Database
docker-compose exec db pg_isready -U vocab_user
```

### 8. Backup Strategy

#### Database Backup
```bash
# Create backup
docker-compose exec db pg_dump -U vocab_user vocab_db > backup_$(date +%Y%m%d).sql

# Restore from backup
docker-compose exec -T db psql -U vocab_user vocab_db < backup_20241102.sql
```

#### Automated Backups
Add to crontab:
```bash
0 2 * * * cd /var/www/vocab-trainer && docker-compose exec -T db pg_dump -U vocab_user vocab_db > /backups/vocab_$(date +\%Y\%m\%d).sql
```

### 9. Scaling

For high traffic, you can scale services:

```bash
# Scale backend
docker-compose up -d --scale backend=3

# Use load balancer (modify nginx config)
upstream backend {
    least_conn;
    server backend_1:5005;
    server backend_2:5005;
    server backend_3:5005;
}
```

### 10. Troubleshooting

#### "Connection refused" errors
- Services still starting: Wait 30 seconds
- Check logs: `docker-compose logs -f`
- Verify ports: `docker-compose ps`

#### Bot not responding
- Check token in `.env`
- View bot logs: `docker-compose logs bot`
- Verify webhook: `curl https://api.telegram.org/botTOKEN/getWebhookInfo`

#### Database errors
- Check PostgreSQL: `docker-compose logs db`
- Verify connection: `docker-compose exec db psql -U vocab_user`
- Reset database: `docker-compose down -v && docker-compose up -d`

#### Memory issues
Add resource limits to `docker-compose.yml`:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
```

### 11. Maintenance

#### Regular Updates
```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Run migrations
docker-compose exec backend npx prisma migrate deploy
```

#### Add More Words
1. Edit `words/words.json`
2. Restart backend: `docker-compose restart backend`
3. Words auto-reload on startup

#### Clear Old Data
```sql
-- Clear old test results (older than 90 days)
DELETE FROM tests WHERE started_at < NOW() - INTERVAL '90 days';

-- Clear old user words
DELETE FROM user_words WHERE next_review_at < NOW() - INTERVAL '1 year';
```

### 12. Security Checklist

- [ ] Strong `BACKEND_JWT_SECRET` (32+ characters)
- [ ] `TELEGRAM_BOT_TOKEN` kept secret
- [ ] HTTPS enabled in production
- [ ] Firewall configured
- [ ] Regular backups scheduled
- [ ] Database credentials secure
- [ ] `.env` file not in git
- [ ] CORS configured properly
- [ ] Rate limiting implemented (optional)
- [ ] Security headers configured (in nginx)

### 13. Performance Optimization

#### Database
```bash
# Create indexes for common queries
docker-compose exec db psql -U vocab_user -d vocab_db -c "
CREATE INDEX idx_user_words_next_review ON user_words(next_review_at);
CREATE INDEX idx_tests_user_date ON tests(user_id, started_at);
"
```

#### Caching
Consider adding Redis for:
- Session management
- API response caching
- Leaderboard caching

### 14. Email Notifications (Optional)

For user notifications, add email service:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Quick Deployment Commands

### Development
```bash
docker-compose up -d
docker-compose logs -f
```

### Production
```bash
./deploy.sh
docker-compose up -d
sudo certbot --nginx -d yourdomain.com
```

### Update
```bash
git pull
docker-compose build
docker-compose up -d
```

### Rollback
```bash
git checkout <previous-commit>
docker-compose build
docker-compose up -d
```

---

For more details, see `README.md` and `QUICKSTART.md`

