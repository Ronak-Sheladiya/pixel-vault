# AWS Elastic Beanstalk Deployment Guide for PixelVault

This guide will walk you through deploying your full-stack PixelVault application (React frontend + Express backend) to AWS Elastic Beanstalk.

## 📋 Prerequisites

Before you begin, ensure you have:

- ✅ AWS Account with appropriate permissions
- ✅ AWS CLI installed and configured
- ✅ EB CLI (Elastic Beanstalk Command Line Interface) installed
- ✅ Node.js 18+ installed locally
- ✅ MongoDB database (MongoDB Atlas recommended)
- ✅ Cloudflare R2 bucket configured
- ✅ Gmail SMTP credentials (or other email service)

---

## 🚀 Step-by-Step Deployment Process

### Step 1: Install AWS CLI and EB CLI

#### Install AWS CLI

**Windows:**
```powershell
# Download and run the MSI installer from:
# https://awscli.amazonaws.com/AWSCLIV2.msi
```

**macOS:**
```bash
brew install awscli
```

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

#### Install EB CLI

```bash
pip install awsebcli --upgrade --user
```

Verify installation:
```bash
aws --version
eb --version
```

---

### Step 2: Configure AWS Credentials

```bash
aws configure
```

You'll be prompted to enter:
- **AWS Access Key ID**: Your AWS access key
- **AWS Secret Access Key**: Your AWS secret key
- **Default region name**: e.g., `us-east-1`
- **Default output format**: `json`

---

### Step 3: Prepare Your Application

#### 3.1 Update package.json Scripts

Your `package.json` already has the correct build script:
```json
"scripts": {
  "build": "vite build && esbuild server/index-prod.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js",
  "start": "NODE_ENV=production node dist/index.js"
}
```

#### 3.2 Test Build Locally

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Verify dist folder exists with index.js and public/
dir dist  # Windows
ls -la dist  # macOS/Linux
```

---

### Step 4: Initialize Elastic Beanstalk

Navigate to your project root and initialize EB:

```bash
cd "d:\cloud project\PixelVault"
eb init
```

You'll be prompted with:

1. **Select a default region**: Choose your preferred region (e.g., `us-east-1`)
2. **Select an application to use**: Create new application
3. **Enter Application Name**: `pixelvault` (or your preferred name)
4. **Select a platform**: Choose `Node.js`
5. **Select a platform branch**: Choose the latest Node.js version (18+)
6. **Do you want to set up SSH**: `Y` (recommended for debugging)

---

### Step 5: Create Environment

Create an Elastic Beanstalk environment:

```bash
eb create pixelvault-prod
```

You'll be prompted with:
1. **Environment name**: `pixelvault-prod` (or your choice)
2. **DNS CNAME prefix**: Press Enter for default or specify custom
3. **Load balancer type**: Choose `application` (recommended)

This process will take 5-10 minutes. EB will:
- Create EC2 instances
- Set up load balancer
- Configure security groups
- Deploy your application

---

### Step 6: Configure Environment Variables

Set all required environment variables:

```bash
eb setenv \
  NODE_ENV=production \
  PORT=8080 \
  MONGODB_URI="your-mongodb-connection-string" \
  JWT_SECRET="your-super-secret-jwt-key" \
  JWT_REFRESH_SECRET="your-super-secret-refresh-key" \
  R2_ACCOUNT_ID="your-cloudflare-account-id" \
  R2_ACCESS_KEY_ID="your-r2-access-key" \
  R2_SECRET_ACCESS_KEY="your-r2-secret-key" \
  R2_BUCKET_NAME="your-bucket-name" \
  R2_PUBLIC_URL="https://your-bucket.r2.dev" \
  EMAIL_HOST="smtp.gmail.com" \
  EMAIL_PORT=587 \
  EMAIL_USER="your-email@gmail.com" \
  EMAIL_PASSWORD="your-app-specific-password" \
  EMAIL_FROM="PixelVault <your-email@gmail.com>" \
  FRONTEND_URL="http://pixelvault-prod.elasticbeanstalk.com" \
  CORS_ORIGIN="http://pixelvault-prod.elasticbeanstalk.com"
```

**Important Notes:**
- Replace all placeholder values with your actual credentials
- Use your actual EB environment URL for `FRONTEND_URL` and `CORS_ORIGIN`
- For Windows PowerShell, remove the backslashes and put everything on one line, OR use backticks (`) instead of backslashes

**Windows PowerShell Alternative:**
```powershell
eb setenv NODE_ENV=production PORT=8080 MONGODB_URI="your-mongodb-uri" JWT_SECRET="your-jwt-secret" JWT_REFRESH_SECRET="your-refresh-secret" R2_ACCOUNT_ID="your-account-id" R2_ACCESS_KEY_ID="your-access-key" R2_SECRET_ACCESS_KEY="your-secret-key" R2_BUCKET_NAME="your-bucket" R2_PUBLIC_URL="https://your-bucket.r2.dev" EMAIL_HOST="smtp.gmail.com" EMAIL_PORT=587 EMAIL_USER="your-email@gmail.com" EMAIL_PASSWORD="your-app-password" EMAIL_FROM="PixelVault <your-email@gmail.com>" FRONTEND_URL="http://your-env.elasticbeanstalk.com" CORS_ORIGIN="http://your-env.elasticbeanstalk.com"
```

---

### Step 7: Deploy Your Application

```bash
# Deploy to Elastic Beanstalk
eb deploy
```

This will:
1. Build your application locally (`npm run build`)
2. Create a deployment package
3. Upload to S3
4. Deploy to your EB environment

**Deployment takes 3-5 minutes.**

---

### Step 8: Open Your Application

```bash
eb open
```

This will open your deployed application in your default browser!

---

## 🔧 Configuration Files Created

The following configuration files have been created for your deployment:

### `.ebextensions/01_nodecommand.config`
Configures Node.js command and environment settings.

### `.ebextensions/02_nginx.config`
Configures Nginx to allow large file uploads (100MB).

### `.ebignore`
Specifies files to exclude from deployment (similar to `.gitignore`).

### `.npmrc`
Ensures npm scripts run with proper permissions on EB.

---

## 📊 Monitoring and Management

### View Application Logs

```bash
eb logs
```

### Check Environment Status

```bash
eb status
```

### SSH into Instance

```bash
eb ssh
```

### View Environment Health

```bash
eb health
```

---

## 🔄 Updating Your Application

Whenever you make changes to your code:

```bash
# 1. Build locally (optional, to test)
npm run build

# 2. Deploy to EB
eb deploy

# 3. Monitor deployment
eb status
```

---

## 🌐 Custom Domain Setup

### Step 1: Add CNAME Record

In your domain registrar (GoDaddy, Namecheap, etc.), add a CNAME record:

- **Type**: CNAME
- **Name**: `www` (or your subdomain)
- **Value**: `your-env-name.elasticbeanstalk.com`

### Step 2: Update Environment Variables

```bash
eb setenv \
  FRONTEND_URL="https://www.yourdomain.com" \
  CORS_ORIGIN="https://www.yourdomain.com"
```

### Step 3: Configure SSL (HTTPS)

1. Go to AWS Certificate Manager (ACM)
2. Request a certificate for your domain
3. Validate domain ownership
4. In EB Console → Configuration → Load Balancer
5. Add HTTPS listener with your ACM certificate

---

## 💾 Database Setup (MongoDB Atlas)

### Recommended: MongoDB Atlas

1. **Create Cluster**: Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. **Create Database User**: Set username and password
3. **Network Access**: Add `0.0.0.0/0` to allow access from anywhere (or specific EB IPs)
4. **Get Connection String**: Copy the connection string
5. **Update Environment Variable**:
   ```bash
   eb setenv MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/pixelvault"
   ```

---

## 🔒 Security Best Practices

- ✅ Use strong, unique secrets for `JWT_SECRET` and `JWT_REFRESH_SECRET`
- ✅ Enable HTTPS with SSL certificate
- ✅ Restrict MongoDB network access to your EB environment IPs
- ✅ Use environment variables for all sensitive data (never commit to git)
- ✅ Enable AWS CloudWatch for monitoring
- ✅ Set up automated backups for MongoDB
- ✅ Configure security groups to only allow necessary ports

---

## 📈 Scaling Configuration

### Auto Scaling

1. Go to EB Console → Configuration → Capacity
2. Configure:
   - **Environment type**: Load balanced
   - **Min instances**: 1
   - **Max instances**: 4 (or based on your needs)
   - **Scaling triggers**: CPU utilization > 70%

### Instance Type

For production, consider:
- **t3.small** - Light traffic (default)
- **t3.medium** - Moderate traffic
- **t3.large** - Heavy traffic

Update instance type:
```bash
eb scale 2  # Scale to 2 instances
```

---

## 🐛 Troubleshooting

### Application Won't Start

```bash
# Check logs
eb logs

# Common issues:
# 1. Missing environment variables
# 2. Build failed - check package.json scripts
# 3. Port mismatch - EB uses PORT=8080 by default
```

### Database Connection Errors

```bash
# Verify MongoDB URI
eb printenv | grep MONGODB_URI

# Check MongoDB Atlas network access
# Ensure 0.0.0.0/0 is whitelisted
```

### File Upload Issues

```bash
# Check R2 credentials
eb printenv | grep R2_

# Verify Nginx configuration allows large uploads
# See .ebextensions/02_nginx.config
```

### 502 Bad Gateway

```bash
# Usually means app crashed
eb logs

# Common causes:
# 1. Missing dependencies
# 2. Incorrect NODE_ENV
# 3. Database connection failed
```

---

## 💰 Cost Estimation

AWS Elastic Beanstalk itself is free, but you pay for:

- **EC2 instances**: ~$15-30/month (t3.small)
- **Load Balancer**: ~$16/month
- **Data transfer**: Variable
- **S3 storage**: Minimal

**Estimated monthly cost**: $30-50 for small to medium traffic

---

## 🔄 CI/CD Integration (Optional)

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS EB

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - name: Deploy to EB
        uses: einaregilsson/beanstalk-deploy@v21
        with:
          aws_access_key: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws_secret_key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          application_name: pixelvault
          environment_name: pixelvault-prod
          region: us-east-1
          version_label: ${{ github.sha }}
          deployment_package: deploy.zip
```

---

## 📚 Useful Commands Reference

| Command | Description |
|---------|-------------|
| `eb init` | Initialize EB in project |
| `eb create` | Create new environment |
| `eb deploy` | Deploy application |
| `eb open` | Open app in browser |
| `eb logs` | View application logs |
| `eb status` | Check environment status |
| `eb health` | View health status |
| `eb ssh` | SSH into instance |
| `eb setenv KEY=value` | Set environment variable |
| `eb printenv` | Print all env variables |
| `eb terminate` | Terminate environment |
| `eb scale N` | Scale to N instances |

---

## 🎯 Quick Start Checklist

- [ ] Install AWS CLI and EB CLI
- [ ] Configure AWS credentials (`aws configure`)
- [ ] Test build locally (`npm run build`)
- [ ] Initialize EB (`eb init`)
- [ ] Create environment (`eb create pixelvault-prod`)
- [ ] Set environment variables (`eb setenv ...`)
- [ ] Deploy application (`eb deploy`)
- [ ] Open and test (`eb open`)
- [ ] Configure custom domain (optional)
- [ ] Set up SSL certificate (optional)
- [ ] Configure auto-scaling (optional)

---

## 📞 Support Resources

- **AWS EB Documentation**: https://docs.aws.amazon.com/elasticbeanstalk/
- **EB CLI Reference**: https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3.html
- **AWS Support**: https://console.aws.amazon.com/support/

---

## 🎉 Success!

Your PixelVault application should now be live on AWS Elastic Beanstalk! 

Access your app at: `http://your-env-name.elasticbeanstalk.com`

For any issues, check the logs with `eb logs` and refer to the troubleshooting section above.
