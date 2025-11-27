# PixelVault Deployment Guide

## Prerequisites

- Node.js 18+ installed
- MongoDB database (local or cloud)
- Cloudflare R2 bucket configured
- SMTP email service (Gmail recommended)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
NODE_ENV=production
PORT=5001

# Database
MONGODB_URI=mongodb://localhost:27017/pixelvault
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pixelvault

# JWT Secrets (generate strong random strings)
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this

# Cloudflare R2
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-bucket.r2.dev

# Email Service (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=PixelVault <your-email@gmail.com>

# Frontend URL (for email links)
FRONTEND_URL=https://your-domain.com

# CORS
CORS_ORIGIN=https://your-domain.com
```

## Building for Production

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the application:**
   ```bash
   npm run build
   ```
   This will:
   - Build the React frontend (output: `dist/public`)
   - Bundle the Express backend (output: `dist/index.js`)

3. **Verify the build:**
   ```bash
   ls -la dist/
   ```
   You should see `index.js` and a `public/` directory.

## Running in Production

### Option 1: Direct Node.js

```bash
NODE_ENV=production node dist/index.js
```

### Option 2: PM2 (Recommended)

PM2 is a production process manager for Node.js applications.

1. **Install PM2 globally:**
   ```bash
   npm install -g pm2
   ```

2. **Start the application:**
   ```bash
   pm2 start dist/index.js --name pixelvault
   ```

3. **Configure PM2 to start on system boot:**
   ```bash
   pm2 startup
   pm2 save
   ```

4. **Useful PM2 commands:**
   ```bash
   pm2 status          # Check status
   pm2 logs pixelvault # View logs
   pm2 restart pixelvault # Restart app
   pm2 stop pixelvault    # Stop app
   pm2 delete pixelvault  # Remove from PM2
   ```

## Database Setup

### MongoDB Atlas (Cloud - Recommended)

1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user
3. Whitelist your server's IP address
4. Get the connection string and update `MONGODB_URI` in `.env`

### Local MongoDB

1. Install MongoDB locally
2. Start MongoDB service:
   ```bash
   # Linux/Mac
   sudo systemctl start mongod
   
   # Windows
   net start MongoDB
   ```
3. Use `MONGODB_URI=mongodb://localhost:27017/pixelvault`

## Cloudflare R2 Setup

1. **Create an R2 bucket:**
   - Go to Cloudflare Dashboard → R2
   - Create a new bucket
   - Note the bucket name

2. **Generate API tokens:**
   - Go to R2 → Manage R2 API Tokens
   - Create API token with read/write permissions
   - Save the Access Key ID and Secret Access Key

3. **Configure public access (optional):**
   - Enable public access on your bucket
   - Get the public URL (e.g., `https://bucket-name.r2.dev`)

## Email Service Setup (Gmail)

1. **Enable 2-Factor Authentication** on your Gmail account

2. **Generate App Password:**
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password in `EMAIL_PASSWORD`

3. **Update environment variables:**
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   ```

## Security Checklist

- [ ] Change all default secrets in `.env`
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable HTTPS (use reverse proxy like Nginx)
- [ ] Configure firewall to only allow necessary ports
- [ ] Set up MongoDB authentication
- [ ] Regularly update dependencies (`npm audit`)
- [ ] Enable MongoDB backups
- [ ] Set up monitoring and logging

## Reverse Proxy Setup (Nginx)

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

## Monitoring

### Application Logs

```bash
# PM2 logs
pm2 logs pixelvault

# Or check log files
tail -f ~/.pm2/logs/pixelvault-out.log
tail -f ~/.pm2/logs/pixelvault-error.log
```

### Health Check Endpoint

The application runs on the configured PORT (default: 5001).

Test with:
```bash
curl http://localhost:5001/api/auth/health
```

## Backup Strategy

### Database Backups

```bash
# Create backup
mongodump --uri="$MONGODB_URI" --out=/path/to/backup

# Restore backup
mongorestore --uri="$MONGODB_URI" /path/to/backup
```

### Automated Backups (Cron)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * mongodump --uri="mongodb://localhost:27017/pixelvault" --out=/backups/$(date +\%Y\%m\%d)
```

## Troubleshooting

### Application won't start

1. Check logs: `pm2 logs pixelvault`
2. Verify environment variables are set
3. Ensure MongoDB is running
4. Check port availability: `lsof -i :5001`

### Database connection errors

1. Verify `MONGODB_URI` is correct
2. Check MongoDB service status
3. Verify network connectivity
4. Check MongoDB authentication

### File upload issues

1. Verify R2 credentials
2. Check R2 bucket permissions
3. Verify network connectivity to Cloudflare
4. Check server disk space

### Email not sending

1. Verify Gmail app password
2. Check SMTP settings
3. Ensure 2FA is enabled on Gmail
4. Check firewall allows outbound SMTP

## Performance Optimization

1. **Enable compression:**
   Already configured in `app.ts` via helmet

2. **Database indexes:**
   Automatically created via Mongoose schemas

3. **Rate limiting:**
   Configured in production mode (100 requests per 15 minutes)

4. **Caching:**
   - Static files cached by Nginx
   - R2 URLs are pre-signed and cached

## Scaling

### Horizontal Scaling

1. Use a load balancer (Nginx, HAProxy)
2. Run multiple instances with PM2:
   ```bash
   pm2 start dist/index.js -i max --name pixelvault
   ```
3. Use Redis for session storage (replace in-memory sessions)

### Database Scaling

1. Use MongoDB replica sets
2. Enable sharding for large datasets
3. Use read replicas for read-heavy workloads

## Support

For issues or questions:
- Check application logs
- Review this deployment guide
- Check MongoDB and R2 service status
