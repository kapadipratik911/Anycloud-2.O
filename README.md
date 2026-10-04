# ANY CLOUD 2.0

A modern, secure cloud storage solution built with React, TypeScript, Express, and Prisma. This is a complete rewrite of the original Flask-based application with enhanced security, modern UI, and improved architecture.

## 🚀 Features

### User Features
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **File Management**: Upload, download, and manage files with a modern dashboard
- **File Sharing**: Generate shareable links for easy file sharing
- **Storage Quotas**: Per-user storage limits with visual progress tracking
- **Search**: Quick file search functionality
- **Trash System**: Soft delete with restore and permanent delete options
- **Responsive Design**: Beautiful UI built with TailwindCSS and shadcn/ui

### Admin Features
- **User Management**: View all users, update storage quotas, delete users
- **Activity Logs**: Track all user actions with detailed logging
- **Visitor Analytics**: Real-time visitor statistics with daily/weekly/monthly views
- **Dashboard**: Comprehensive admin panel with charts and metrics

### Security Features
- **Rate Limiting**: API rate limiting to prevent abuse
- **Helmet**: Security headers for Express
- **CORS**: Configurable CORS policies
- **Input Validation**: Request validation with express-validator
- **File Type Validation**: Restricted file uploads by extension
- **Path Traversal Protection**: Security checks on file operations

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **Prisma** - ORM and database toolkit
- **PostgreSQL/Supabase** - Cloud-hosted database (SQLite for local dev)
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **Helmet** - Security headers
- **express-rate-limit** - Rate limiting

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **TailwindCSS** - Utility-first CSS
- **shadcn/ui** - UI components
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Axios** - HTTP client
- **Recharts** - Charts for analytics

## 📁 Project Structure

```
any-cloud-2.0/
├── backend/
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Express middleware
│   │   ├── routes/       # API routes
│   │   ├── utils/        # Utility functions
│   │   └── server.ts     # Application entry point
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   ├── uploads/          # User file storage
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── context/      # React context providers
│   │   ├── lib/          # Utilities and API client
│   │   ├── pages/        # Page components
│   │   └── main.tsx      # React entry point
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd any-cloud-2.0
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

4. **Configure environment variables**
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
# Make sure to set a secure JWT_SECRET
```

5. **Initialize the database**

**For local development (SQLite):**
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

**For production (Supabase/PostgreSQL):**
- Follow the [Supabase Setup Guide](./SUPABASE_SETUP.md) to configure a cloud database
- This is recommended for production, mobile apps, and deployments like Render
- Supabase provides a free tier with 500MB database storage

6. **Seed the database (optional)**
```bash
cd backend
npm run seed
```
This creates an admin user (username: `admin`, password: `admin123`)

### Development

**Start the backend:**
```bash
cd backend
npm run dev
```
Backend will run on `http://localhost:5000`

**Start the frontend:**
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:5173`

### Production with Docker

**Using Docker Compose:**
```bash
docker-compose up --build
```

This will start both backend and frontend services:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

**Manual Docker build:**
```bash
# Build and run backend
cd backend
docker build -t any-cloud-backend .
docker run -p 5000:5000 -v $(pwd)/uploads:/app/uploads any-cloud-backend

# Build and run frontend
cd frontend
docker build -t any-cloud-frontend .
docker run -p 3000:80 any-cloud-frontend
```

## 🔧 Configuration

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | Database connection string | `file:./dev.db` (local) / Supabase URL (prod) |
| `JWT_SECRET` | Secret key for JWT tokens | `change-this` |
| `JWT_EXPIRES_IN` | Token expiration time | `7d` |
| `MAX_FILE_SIZE` | Maximum file size in bytes | `10737418240` (10GB) |
| `UPLOAD_DIR` | Upload directory path | `./uploads` |
| `ALLOWED_EXTENSIONS` | Allowed file extensions | `png,jpg,jpeg,pdf,txt,zip,mp4` |
| `CORS_ORIGIN` | CORS allowed origin | `http://localhost:5173` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit time window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000/api` |

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile and storage info

### Files
- `POST /api/files/upload` - Upload file
- `GET /api/files` - Get user files
- `GET /api/files/download/:fileId` - Download file
- `DELETE /api/files/:fileId` - Move file to trash
- `GET /api/files/trash` - Get trash files
- `POST /api/files/trash/:fileId/restore` - Restore file from trash
- `DELETE /api/files/trash/:fileId/permanent` - Permanently delete file

### Shares
- `POST /api/shares` - Create share link
- `GET /api/shares/user` - Get user's shares
- `DELETE /api/shares/:shareId` - Delete share link
- `GET /api/shares/public/:token` - Download shared file

### Admin
- `GET /api/admin/users` - Get all users (admin only)
- `PUT /api/admin/users/:username/quota` - Update user quota (admin only)
- `DELETE /api/admin/users/:username` - Delete user (admin only)
- `GET /api/admin/logs` - Get activity logs (admin only)
- `GET /api/admin/visitor-stats` - Get visitor statistics
- `POST /api/admin/track-visit` - Track page visit

### Health
- `GET /api/health` - Health check endpoint

## 🔐 Security Considerations

### Production Deployment Checklist

1. **Change JWT Secret**: Set a strong, random `JWT_SECRET` in production
2. **Use HTTPS**: Enable SSL/TLS for all connections
3. **Database Security**: Consider upgrading to PostgreSQL for production
4. **File Storage**: Use cloud storage (AWS S3, etc.) for file uploads in production
5. **Rate Limiting**: Adjust rate limits based on your needs
6. **CORS**: Restrict CORS to your domain only
7. **Environment Variables**: Never commit `.env` files
8. **Regular Backups**: Implement database and file backup strategy
9. **Monitoring**: Set up application monitoring and logging
10. **Input Validation**: All inputs are validated, but review as needed

## 🧪 Testing

The project structure supports testing. Add your test files in:
- Backend: `backend/src/__tests__/`
- Frontend: `frontend/src/__tests__/`

Run tests with:
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 📝 Database Schema

The application uses Prisma ORM with SQLite for local development and PostgreSQL/Supabase for production. The schema includes:

- **User**: User accounts with roles and quotas
- **File**: File metadata and storage information
- **Folder**: Folder structure for organization
- **Share**: File sharing links
- **Log**: Activity logging
- **Visit**: Visitor analytics
- **Tag**: File tagging system
- **Favorite**: User favorites
- **AICategory**: AI-powered file categorization
- **AISuggestion**: AI recommendations

View the full schema in `backend/prisma/schema.prisma`.

### Database Setup

**For Local Development (SQLite):**
- SQLite is configured by default for easy local development
- No external database required
- Perfect for testing and development

**For Production (Supabase/PostgreSQL):**
- Follow the [Supabase Setup Guide](./SUPABASE_SETUP.md) for detailed instructions
- Supabase provides a free tier with 500MB database storage
- Cloud-hosted database accessible from anywhere
- Ideal for production, mobile apps, and multi-platform deployments
- Automatic backups and scaling

## 🚀 Deployment Options

### Supabase + Render (Recommended)
1. Set up a Supabase project following the [Supabase Setup Guide](./SUPABASE_SETUP.md)
2. Deploy backend to Render with Supabase DATABASE_URL
3. Deploy frontend to Vercel or Render
4. Your database is now cloud-hosted and accessible from anywhere

### Vercel (Frontend)
1. Connect your GitHub repository to Vercel
2. Set environment variables
3. Deploy automatically on push

### Railway/Render (Full Stack)
1. Connect your GitHub repository
2. Railway/Render will detect the Docker setup
3. Configure environment variables (including Supabase DATABASE_URL)
4. Deploy

### Self-Hosted (VPS)
1. Clone repository to server
2. Install Docker and Docker Compose
3. Configure environment variables
4. Run `docker-compose up -d`
5. Set up nginx reverse proxy for HTTPS

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Original ANY CLOUD project for the inspiration
- shadcn/ui for the beautiful UI components
- Prisma team for the excellent ORM
- The open-source community

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review the API endpoints section

---

Built with ❤️ using modern web technologies
