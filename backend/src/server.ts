import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import authRoutes from './routes/auth';
import fileRoutes from './routes/files';
import shareRoutes from './routes/shares';
import adminRoutes from './routes/admin';
import folderRoutes from './routes/folders';
import fileVersionRoutes from './routes/fileVersions';
import fileCommentRoutes from './routes/fileComments';
import tagRoutes from './routes/tags';
import favoriteRoutes from './routes/favorites';
import bulkRoutes from './routes/bulk';
import aiOrganizationRoutes from './routes/aiOrganization';
import storageRequestRoutes from './routes/storageRequests';
import { errorHandler, notFound } from './middleware/errorHandler';
import fs from 'fs';
import path from 'path';
import { initializeCategories } from './controllers/aiOrganizationController';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create upload directory
fs.mkdirSync(config.uploadDir, { recursive: true });

// Initialize AI categories
initializeCategories().catch(console.error);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/file-versions', fileVersionRoutes);
app.use('/api/file-comments', fileCommentRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/bulk', bulkRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiOrganizationRoutes);
app.use('/api/storage-requests', storageRequestRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ANY CLOUD 2.0 API is running' });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 ANY CLOUD 2.0 API server running on port ${PORT}`);
  console.log(`📁 Upload directory: ${config.uploadDir}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
});

export default app;
