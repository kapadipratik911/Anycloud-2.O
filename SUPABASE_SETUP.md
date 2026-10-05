# Supabase Setup Guide

This guide will help you migrate from SQLite to Supabase (PostgreSQL) for a production-ready, cloud-hosted database that can be accessed by your web app, mobile app, and Render deployment.

## Why Supabase?

- **Free Tier**: Generous free tier with 500MB database storage
- **PostgreSQL**: Full PostgreSQL database with advanced features
- **Real-time**: Built-in real-time subscriptions
- **Auth**: Optional authentication system (we're using custom JWT)
- **Cloud Hosted**: Accessible from anywhere, perfect for multi-platform apps
- **Backups**: Automatic daily backups
- **Scalable**: Easy to scale as your application grows

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in the project details:
   - **Name**: any-cloud-2.0 (or your preferred name)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose the region closest to your users
   - **Pricing Plan**: Free tier is fine for development
5. Click "Create new project"
6. Wait for the project to be provisioned (2-3 minutes)

## Step 2: Get Database Connection String (Connection Pooler for Railway / Render)

> [!IMPORTANT]
> **Why Error P1001 Happens on Railway / Render:**
> Supabase direct database connection URLs (`db.[PROJECT-REF].supabase.co:5432`) only have **IPv6** addresses. Most cloud hosts (including Railway and Render free tier) **do not support IPv6 outbound connections**. If you use the direct URL on Railway, Prisma will fail with:
> `Error: P1001: Can't reach database server at db.[PROJECT-REF].supabase.co:5432`
>
> **The Solution:** Always use the Supabase **Connection Pooler (Supavisor)** on port `5432` (Session mode) or port `6543` (Transaction mode). The pooler supports **IPv4**.

1. Go to your Supabase project dashboard
2. Navigate to **Settings** > **Database**
3. Scroll down to **Connection Pooling** (or **Connection String** > **Transaction / Session Pooler**)
4. Select **Session** mode (port 5432) or **Transaction** mode (port 6543)
5. Select **URI** format
6. The connection string looks like:
   ```
   # Session mode (port 5432) - Recommended for Railway with Prisma:
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres

   # Or Transaction mode (port 6543 with pgbouncer):
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
   *Note: Notice the username format is `postgres.[PROJECT-REF]` instead of just `postgres`.*
7. Replace `[YOUR-PASSWORD]` with your actual database password.

## Step 3: Update Environment Variables

### For Local Development

Update your `.env` file in the project root:

```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

### For Production (Railway, Render, etc.)

Add `DATABASE_URL` as an environment variable in your Railway project settings:

```env
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

For this specific Supabase project (`vtczrvskyjizdvycawid` in Tokyo / `ap-northeast-1`):
```env
DATABASE_URL=postgresql://postgres.vtczrvskyjizdvycawid:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres
```

**Important**: Never commit your `.env` file or expose your database password!


## Step 4: Install PostgreSQL Dependencies

Since we're switching from SQLite to PostgreSQL, we need to install the PostgreSQL driver:

```bash
cd backend
npm install pg
```

## Step 5: Update Prisma Schema

The Prisma schema has already been updated to use PostgreSQL. Key changes:

- Changed provider from `sqlite` to `postgresql`
- Added `@db.Text` for text fields that need to store large content
- All other schema definitions remain compatible

## Step 6: Generate Prisma Client

Generate the Prisma client for PostgreSQL:

```bash
cd backend
npx prisma generate
```

## Step 7: Push Schema to Supabase

Push your database schema to Supabase:

```bash
cd backend
npx prisma db push
```

This will create all tables in your Supabase database based on your Prisma schema.

## Step 8: Seed the Database (Optional)

If you want to create the admin user:

```bash
cd backend
npm run seed
```

This will create an admin user with:
- Username: `admin`
- Password: `admin123`

## Step 9: Run the Application

Start the backend server:

```bash
cd backend
npm run dev
```

Start the frontend:

```bash
cd frontend
npm run dev
```

## Step 10: Verify the Connection

1. Go to your Supabase dashboard
2. Navigate to **Table Editor**
3. You should see all your tables: User, File, Folder, etc.
4. Try registering a user in your app
5. Check if the user appears in the Supabase User table

## Step 11: Configure Supabase for Production

### Enable Connection Pooling (Recommended)

For production deployments (Render, etc.), use connection pooling:

1. Go to Supabase Dashboard > Settings > Database
2. Scroll to **Connection Pooling**
3. Enable **Transaction Mode** or **Session Mode**
4. Use the pooled connection string:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```

### Set Up Row Level Security (Optional)

If you want to use Supabase's built-in RLS:

1. Go to **Authentication** > **Policies**
2. Enable RLS on tables
3. Create policies for your access patterns

Note: Since we're using custom JWT authentication, RLS is optional but recommended for additional security.

## Step 12: Deploy to Render

### Backend Deployment

1. Push your code to GitHub
2. Create a new Web Service on Render
3. Connect your repository
4. Set build command: `cd backend && npm install && npm run build`
5. Set start command: `cd backend && npm start`
6. Add environment variables:
   - `DATABASE_URL`: Your Supabase connection string
   - `JWT_SECRET`: Generate a secure random string
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - All other variables from your `.env` file

### Frontend Deployment

1. Create a new Static Site on Render
2. Connect your repository
3. Set build command: `cd frontend && npm install && npm run build`
4. Set publish directory: `frontend/dist`
5. Add environment variable:
   - `VITE_API_URL`: Your backend Render URL (e.g., `https://your-backend.onrender.com/api`)

## Step 13: Mobile App Integration

For your mobile app (React Native, Flutter, etc.):

1. Use the same Supabase connection string
2. Ensure your mobile app can access the Supabase API
3. Configure CORS in Supabase if needed:
   - Go to Settings > API
   - Add your mobile app's allowed origins
4. Use the same API endpoints as your web app

## Troubleshooting

### Connection Refused

- Check if your Supabase project is active
- Verify your database password is correct
- Ensure you're using the correct connection string format

### Migration Issues

If you encounter migration errors:

```bash
# Reset the database (CAUTION: deletes all data)
npx prisma db push --force-reset

# Then push the schema again
npx prisma db push
```

### SSL Issues

If you get SSL errors, add `?sslmode=require` to your connection string:

```
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres?sslmode=require"
```

## Monitoring

Supabase provides built-in monitoring:

1. **Dashboard**: View database performance
2. **Logs**: Check query logs and errors
3. **Database Report**: See storage usage and performance metrics

## Backup Strategy

Supabase automatically creates daily backups. For additional safety:

1. Go to Settings > Database > Backups
2. You can manually create backups
3. Point-in-time recovery is available (up to 7 days on free tier)

## Cost Considerations

### Free Tier Limits
- 500MB database storage
- 1GB bandwidth
- 50,000 monthly active users
- 2GB file storage (if using Supabase Storage)

### When to Upgrade
- Database storage > 500MB
- High traffic (> 50k MAU)
- Need longer backup retention

## Next Steps

1. Test the application thoroughly with Supabase
2. Set up monitoring and alerts
3. Configure backup strategy
4. Plan for scaling
5. Document your Supabase project details for your team

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [Render Database Guide](https://render.com/docs/databases)

---

**Congratulations!** Your application now uses Supabase for a production-ready, cloud-hosted database that can be accessed from your web app, mobile app, and any deployment platform.
