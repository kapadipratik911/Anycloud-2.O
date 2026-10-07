# Render Deployment Guide

This guide provides step-by-step instructions for deploying ANY CLOUD 2.0 to Render using Supabase as the database.

## ⚠️ Critical: Supabase Connection URL

**Prisma Error P1001 Fix:**
Render's free tier and many cloud hosts do not support IPv6 outbound connections. Supabase's direct database URL (`db.[PROJECT-REF].supabase.co:5432`) is IPv6-only, which causes the error:

```
Error: P1001: Can't reach database server at `db.vtczrvskyjizdvycawid.supabase.co:5432`
```

**Solution:** You MUST use the Supabase **Connection Pooler URL** (IPv4) for Render deployment.

## Step 1: Get Your Supabase Connection Pooler URL

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Scroll down to **Connection String**
4. Select **Session** mode (recommended) or **Transaction** mode
5. Select **URI** format
6. Copy the connection string

**For your project (vtczrvskyjizdvycawid):**
```
postgresql://postgres.vtczrvskyjizdvycawid:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres
```

**Notice the differences from direct URL:**
- Host: `aws-0-ap-northeast-1.pooler.supabase.com` (pooler, not db)
- Username: `postgres.vtczrvskyjizdvycawid` (with project ref)
- Port: `5432` (pooler port)

## Step 2: Deploy Backend to Render

### 2.1 Create a New Web Service

1. Go to [render.com](https://render.com)
2. Sign up/login with GitHub
3. Click **New +** → **Web Service**
4. Connect your repository: `kapadipratik911/Anycloud-2.O`
5. Click **Connect**

### 2.2 Configure Build Settings

**Root Directory:** `/` (empty - uses root Dockerfile)

**Build Command:** (Auto-detected by Dockerfile)
```
docker build -t any-cloud-2.0 .
```

**Start Command:** (Auto-detected by Dockerfile)
```
sh -c "npx prisma generate && npx prisma db push --skip-generate && node dist/server.js"
```

### 2.3 Configure Environment Variables

Add these environment variables in Render dashboard:

**Required:**
```
DATABASE_URL=postgresql://postgres.vtczrvskyjizdvycawid:wKyw6yZkzh4Z612v@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres
NODE_ENV=production
PORT=5000
JWT_SECRET=generate-a-secure-random-string-here
```

**Optional (but recommended):**
```
JWT_EXPIRES_IN=7d
MAX_FILE_SIZE=10737418240
UPLOAD_DIR=/app/uploads
ALLOWED_EXTENSIONS=png,jpg,jpeg,gif,bmp,webp,svg,pdf,txt,doc,docx,xls,xlsx,ppt,pptx,csv,rtf,odt,ods,odp,zip,rar,7z,tar,gz,mp4,mov,avi,mkv,webm,flv,wmv,mp3,wav,ogg,flac,aac,m4a,js,ts,html,css,json,py,java,cpp,c,php,rb,go,md
CORS_ORIGIN=https://your-frontend-url.onrender.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Important Notes:**
- Replace `wKyw6yZkzh4Z612v` with your actual Supabase database password
- Generate a secure random string for `JWT_SECRET` (use `openssl rand -base64 32`)
- Set `CORS_ORIGIN` to your frontend Render URL once deployed
- The `DATABASE_URL` MUST be the pooler URL, not the direct URL

### 2.4 Deploy

Click **Create Web Service** and wait for deployment.

**What happens during deployment:**
1. Render builds the Docker image from the root Dockerfile
2. TypeScript is compiled
3. Prisma client is generated (at runtime with DATABASE_URL)
4. Database schema is synced with Supabase
5. Server starts on port 5000

## Step 3: Deploy Frontend to Render

### 3.1 Create a New Web Service

1. Click **New +** → **Web Service**
2. Connect the same repository
3. Click **Connect**

### 3.2 Configure Build Settings

**Root Directory:** `frontend`

**Build Command:**
```
npm install && npm run build
```

**Start Command:**
```
npm run preview
```

Or use Render's **Static Site** option instead:
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Runtime: `node`

### 3.3 Configure Environment Variables

```
VITE_API_URL=https://your-backend-url.onrender.com/api
```

Replace `your-backend-url` with your actual backend Render URL.

### 3.4 Deploy

Click **Create Web Service** and wait for deployment.

## Step 4: Update CORS and Test

### 4.1 Update Backend CORS

1. Go to your backend Web Service on Render
2. Click **Environment**
3. Update `CORS_ORIGIN` to your frontend URL:
   ```
   CORS_ORIGIN=https://your-frontend-url.onrender.com
   ```
4. Click **Save Changes**
5. Wait for the service to redeploy

### 4.2 Update Supabase CORS (Optional)

If you need direct Supabase access from frontend:

1. Go to Supabase Dashboard → Settings → API
2. Add your frontend URL to **CORS allowed origins**
3. Click **Save**

### 4.3 Test the Deployment

1. Visit your frontend URL
2. Try registering a new user
3. Check if the user appears in Supabase Table Editor
4. Test file upload, download, and other features

## Step 5: File Storage Considerations

⚠️ **Important:** Render's free tier provides ephemeral storage. Files uploaded to the local filesystem (`/app/uploads`) will be lost when the service restarts or redeploys.

**For persistent file storage, consider:**
- **Supabase Storage** (recommended for Supabase users)
- **AWS S3** or other cloud storage
- **Render Disk** (paid add-on for persistent storage)

To migrate to Supabase Storage:
1. Install Supabase Storage SDK
2. Update file upload logic to use Supabase Storage
3. Update file download logic to fetch from Supabase Storage
4. Store Supabase Storage file paths in database instead of local paths

## Troubleshooting

### Error: P1001: Can't reach database server

**Cause:** Using direct Supabase URL instead of pooler URL

**Solution:**
- Verify DATABASE_URL uses `pooler.supabase.com` host
- Verify username includes project ref: `postgres.vtczrvskyjizdvycawid`
- Verify port is `5432` (session mode) or `6543` (transaction mode)

### Error: Build failed - TypeScript errors

**Cause:** TypeScript compilation errors

**Solution:**
- All TypeScript errors should be fixed in the repository
- Check build logs for specific errors
- Ensure `npm run build` runs successfully locally

### Error: Prisma migration failed

**Cause:** Database connection or schema issues

**Solution:**
- Verify DATABASE_URL is correct
- Check Supabase project is active
- Verify Supabase database password is correct
- Try running `npx prisma db push` locally with the same DATABASE_URL

### Error: CORS blocked

**Cause:** CORS_ORIGIN not set correctly

**Solution:**
- Set CORS_ORIGIN to your frontend URL
- Include protocol (https://)
- Don't include trailing slash
- Restart backend service after changing

### Files disappear after redeploy

**Cause:** Ephemeral storage on Render free tier

**Solution:**
- Implement cloud storage (Supabase Storage, AWS S3)
- Or upgrade to Render Disk for persistent storage

## Environment Variables Reference

### Backend (Required)
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Supabase pooler connection string | `postgresql://postgres.vtczrvskyjizdvycawid:xxx@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres` |
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `5000` |
| `JWT_SECRET` | JWT signing secret | `<generate-secure-random-string>` |

### Backend (Optional)
| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `MAX_FILE_SIZE` | Max file size in bytes | `10737418240` |
| `UPLOAD_DIR` | Upload directory | `/app/uploads` |
| `ALLOWED_EXTENSIONS` | Allowed file types | `png,jpg,jpeg,...` |
| `CORS_ORIGIN` | CORS allowed origin | Frontend URL |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests | `100` |

### Frontend
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://your-backend.onrender.com/api` |

## Cost Estimation

### Render Free Tier
- **Backend Web Service**: Free (750 hours/month)
- **Frontend Web Service**: Free (750 hours/month)
- **Limitations**: Service spins down after 15 min inactivity

### When to Upgrade
- Production traffic > free tier limits
- Need persistent file storage (Render Disk)
- Need faster startup times (avoid spin-up delay)

## Support

- [Render Documentation](https://render.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Setup Guide](./SUPABASE_SETUP.md)
- [Project README](./README.md)

---

**Congratulations!** Your ANY CLOUD 2.0 application is now deployed on Render with Supabase as the cloud database.
