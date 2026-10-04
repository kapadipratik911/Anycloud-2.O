import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import fs from 'fs/promises';
import path from 'path';

// Folder pattern detection rules
const FOLDER_PATTERNS = {
  document: {
    keywords: ['document', 'docs', 'pdf', 'word', 'text', 'paper', 'report', 'invoice', 'contract'],
    mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/csv'],
    extensions: ['.pdf', '.doc', '.docx', '.txt', '.csv', '.rtf', '.odt']
  },
  image: {
    keywords: ['image', 'images', 'photo', 'photos', 'picture', 'pictures', 'img', 'screenshot', 'wallpaper'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff']
  },
  video: {
    keywords: ['video', 'videos', 'movie', 'movies', 'clip', 'footage', 'recording'],
    mimeTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
    extensions: ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.flv', '.wmv']
  },
  audio: {
    keywords: ['audio', 'music', 'sound', 'song', 'songs', 'mp3', 'playlist', 'podcast'],
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
    extensions: ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a']
  },
  code: {
    keywords: ['code', 'programming', 'script', 'source', 'dev', 'development', 'project'],
    mimeTypes: ['text/javascript', 'text/html', 'text/css', 'application/json', 'text/x-python'],
    extensions: ['.js', '.ts', '.html', '.css', '.json', '.py', '.java', '.cpp', '.c', '.php', '.rb', '.go']
  },
  archive: {
    keywords: ['archive', 'zip', 'compressed', 'backup', 'rar'],
    mimeTypes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/x-tar'],
    extensions: ['.zip', '.rar', '.7z', '.tar', '.gz']
  },
  spreadsheet: {
    keywords: ['spreadsheet', 'excel', 'sheet', 'data', 'table', 'csv', 'report'],
    mimeTypes: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    extensions: ['.xls', '.xlsx', '.csv', '.ods']
  },
  presentation: {
    keywords: ['presentation', 'slide', 'ppt', 'powerpoint', 'deck'],
    mimeTypes: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    extensions: ['.ppt', '.pptx', '.odp']
  }
};

// Detect folder purpose from name
const detectFolderPurpose = (folderName: string) => {
  const lowerName = folderName.toLowerCase();
  
  for (const [purpose, pattern] of Object.entries(FOLDER_PATTERNS)) {
    // Check if folder name contains any keywords
    if (pattern.keywords.some(keyword => lowerName.includes(keyword))) {
      return {
        purpose,
        confidence: 0.9,
        pattern
      };
    }
  }
  
  return null;
};

// Find files that match folder purpose
const findMatchingFiles = async (userId: string, folderId: string, purpose: string, pattern: any) => {
  const conditions: any[] = [];
  
  // Add MIME type conditions
  for (const mt of pattern.mimeTypes) {
    conditions.push({ mimeType: { contains: mt } });
  }
  
  // Add extension conditions
  for (const ext of pattern.extensions) {
    conditions.push({ originalName: { endsWith: ext } });
  }
  
  const whereClause: any = {
    userId,
    isDeleted: false,
    folderId: null, // Only files not in any folder
  };
  
  if (conditions.length > 0) {
    whereClause.OR = conditions;
  }
  
  const files = await prisma.file.findMany({
    where: whereClause
  });
  
  return files;
};

// Smart file categorization rules
const CATEGORIZATION_RULES = {
  // Document types
  documents: {
    mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/csv'],
    extensions: ['.pdf', '.doc', '.docx', '.txt', '.csv', '.rtf'],
    icon: 'file-text',
    color: '#3b82f6',
    priority: 1
  },
  // Images
  images: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'],
    icon: 'image',
    color: '#10b981',
    priority: 2
  },
  // Videos
  videos: {
    mimeTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
    extensions: ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.flv'],
    icon: 'film',
    color: '#f59e0b',
    priority: 3
  },
  // Audio
  audio: {
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
    extensions: ['.mp3', '.wav', '.ogg', '.flac', '.aac'],
    icon: 'music',
    color: '#8b5cf6',
    priority: 4
  },
  // Archives
  archives: {
    mimeTypes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/x-tar'],
    extensions: ['.zip', '.rar', '.7z', '.tar', '.gz'],
    icon: 'archive',
    color: '#ef4444',
    priority: 5
  },
  // Code
  code: {
    mimeTypes: ['text/javascript', 'text/html', 'text/css', 'application/json', 'text/x-python'],
    extensions: ['.js', '.ts', '.html', '.css', '.json', '.py', '.java', '.cpp', '.c', '.php', '.rb'],
    icon: 'code',
    color: '#ec4899',
    priority: 6
  },
  // Spreadsheets
  spreadsheets: {
    mimeTypes: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    extensions: ['.xls', '.xlsx', '.csv', '.ods'],
    icon: 'table',
    color: '#06b6d4',
    priority: 7
  },
  // Presentations
  presentations: {
    mimeTypes: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    extensions: ['.ppt', '.pptx', '.odp'],
    icon: 'presentation',
    color: '#f97316',
    priority: 8
  },
  // Other
  other: {
    mimeTypes: [],
    extensions: [],
    icon: 'file',
    color: '#6b7280',
    priority: 9
  }
};

// Initialize default AI categories
export const initializeCategories = async () => {
  try {
    const existingCategories = await prisma.aICategory.count();
    if (existingCategories > 0) return;

    const categories = Object.entries(CATEGORIZATION_RULES).map(([key, config]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      description: `Automatically categorized ${key} files`,
      icon: config.icon,
      color: config.color,
      priority: config.priority
    }));

    await prisma.aICategory.createMany({
      data: categories
    });
  } catch (error) {
    console.error('Failed to initialize AI categories:', error);
  }
};

// Analyze file and determine category
const analyzeFile = (file: any) => {
  const mimeType = file.mimeType.toLowerCase();
  const fileName = file.originalName.toLowerCase();
  const extension = path.extname(fileName).toLowerCase();

  for (const [categoryName, config] of Object.entries(CATEGORIZATION_RULES)) {
    if (categoryName === 'other') continue;

    // Check MIME type
    if (config.mimeTypes.some(mt => mimeType.includes(mt))) {
      return { categoryName, confidence: 0.9 };
    }

    // Check extension
    if (config.extensions.some(ext => extension === ext)) {
      return { categoryName, confidence: 0.85 };
    }
  }

  return { categoryName: 'other', confidence: 0.5 };
};

// Generate AI suggestions for a file
const generateSuggestions = async (file: any, fileName: string) => {
  const suggestions = [];
  const lowerName = fileName.toLowerCase();

  // Folder suggestions based on file patterns
  if (lowerName.includes('invoice') || lowerName.includes('bill')) {
    suggestions.push({
      type: 'folder',
      suggestion: 'Documents/Financial',
      confidence: 0.8
    });
  } else if (lowerName.includes('resume') || lowerName.includes('cv')) {
    suggestions.push({
      type: 'folder',
      suggestion: 'Documents/Professional',
      confidence: 0.85
    });
  } else if (lowerName.includes('screenshot') || lowerName.includes('capture')) {
    suggestions.push({
      type: 'folder',
      suggestion: 'Images/Screenshots',
      confidence: 0.9
    });
  } else if (lowerName.includes('photo') || lowerName.includes('picture')) {
    suggestions.push({
      type: 'folder',
      suggestion: 'Images/Photos',
      confidence: 0.85
    });
  }

  // Tag suggestions
  const category = analyzeFile(file);
  if (category.categoryName !== 'other') {
    suggestions.push({
      type: 'tag',
      suggestion: category.categoryName,
      confidence: category.confidence
    });
  }

  // Rename suggestions (clean up file names)
  const cleanName = fileName
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (cleanName !== fileName) {
    suggestions.push({
      type: 'rename',
      suggestion: cleanName,
      confidence: 0.7
    });
  }

  return suggestions;
};

// Analyze text content for intelligent organization
const analyzeTextContent = async (filePath: string) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const keywords = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const keywordCounts = keywords.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get top keywords
    const topKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    return topKeywords;
  } catch (error) {
    return [];
  }
};

export const categorizeFile = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    const userId = req.userId!;

    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, isDeleted: false },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Analyze file
    const analysis = analyzeFile(file);
    
    // Get or create category
    let category = await prisma.aICategory.findFirst({
      where: { name: analysis.categoryName.charAt(0).toUpperCase() + analysis.categoryName.slice(1) }
    });

    if (!category) {
      category = await prisma.aICategory.create({
        data: {
          name: analysis.categoryName.charAt(0).toUpperCase() + analysis.categoryName.slice(1),
          description: `AI-categorized ${analysis.categoryName} files`,
          icon: CATEGORIZATION_RULES[analysis.categoryName as keyof typeof CATEGORIZATION_RULES]?.icon || 'file',
          color: CATEGORIZATION_RULES[analysis.categoryName as keyof typeof CATEGORIZATION_RULES]?.color || '#6b7280',
          priority: CATEGORIZATION_RULES[analysis.categoryName as keyof typeof CATEGORIZATION_RULES]?.priority || 9
        }
      });
    }

    // Update file with category
    await prisma.file.update({
      where: { id: fileId },
      data: { aiCategoryId: category.id }
    });

    // Log the categorization
    await prisma.log.create({
      data: {
        userId,
        action: 'ai_categorize',
        details: `AI categorized ${file.originalName} as ${category.name}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({
      message: 'File categorized successfully',
      category: category.name,
      confidence: analysis.confidence
    });
  } catch (error) {
    console.error('Categorize file error:', error);
    res.status(500).json({ error: 'Failed to categorize file' });
  }
};

export const categorizeAllFiles = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Get all uncategorized files
    const files = await prisma.file.findMany({
      where: { userId, isDeleted: false, aiCategoryId: null },
    });

    let categorizedCount = 0;
    const categories = await prisma.aICategory.findMany();

    for (const file of files) {
      const analysis = analyzeFile(file);
      
      let category = categories.find(c => 
        c.name === analysis.categoryName.charAt(0).toUpperCase() + analysis.categoryName.slice(1)
      );

      if (!category) {
        category = await prisma.aICategory.create({
          data: {
            name: analysis.categoryName.charAt(0).toUpperCase() + analysis.categoryName.slice(1),
            description: `AI-categorized ${analysis.categoryName} files`,
            icon: CATEGORIZATION_RULES[analysis.categoryName as keyof typeof CATEGORIZATION_RULES]?.icon || 'file',
            color: CATEGORIZATION_RULES[analysis.categoryName as keyof typeof CATEGORIZATION_RULES]?.color || '#6b7280',
            priority: CATEGORIZATION_RULES[analysis.categoryName as keyof typeof CATEGORIZATION_RULES]?.priority || 9
          }
        });
        categories.push(category);
      }

      await prisma.file.update({
        where: { id: file.id },
        data: { aiCategoryId: category.id }
      });

      categorizedCount++;
    }

    await prisma.log.create({
      data: {
        userId,
        action: 'ai_bulk_categorize',
        details: `AI categorized ${categorizedCount} files`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({
      message: 'Files categorized successfully',
      categorizedCount,
      totalFiles: files.length
    });
  } catch (error) {
    console.error('Categorize all files error:', error);
    res.status(500).json({ error: 'Failed to categorize files' });
  }
};

export const getSuggestions = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    const userId = req.userId!;

    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, isDeleted: false },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Generate new suggestions
    const suggestions = await generateSuggestions(file, file.originalName);

    // Store suggestions in database
    await prisma.aISuggestion.deleteMany({
      where: { fileId, applied: false }
    });

    for (const suggestion of suggestions) {
      await prisma.aISuggestion.create({
        data: {
          fileId,
          type: suggestion.type,
          suggestion: suggestion.suggestion,
          confidence: suggestion.confidence
        }
      });
    }

    // For text files, analyze content
    if (file.mimeType.startsWith('text/')) {
      try {
        const keywords = await analyzeTextContent(file.path);
        for (const keyword of keywords) {
          await prisma.aISuggestion.create({
            data: {
              fileId,
              type: 'tag',
              suggestion: keyword,
              confidence: 0.6
            }
          });
        }
      } catch (error) {
        console.error('Text analysis error:', error);
      }
    }

    // Return all suggestions
    const dbSuggestions = await prisma.aISuggestion.findMany({
      where: { fileId, applied: false },
      orderBy: { confidence: 'desc' }
    });

    res.json({ suggestions: dbSuggestions });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
};

export const applySuggestion = async (req: AuthRequest, res: Response) => {
  try {
    const { suggestionId } = req.params;
    const userId = req.userId!;

    const suggestion = await prisma.aISuggestion.findFirst({
      where: { id: suggestionId },
      include: { file: true }
    });

    if (!suggestion) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }

    if (suggestion.file.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Apply suggestion based on type
    switch (suggestion.type) {
      case 'tag':
        // Create or get tag
        let tag = await prisma.tag.findFirst({
          where: { name: suggestion.suggestion, userId }
        });

        if (!tag) {
          tag = await prisma.tag.create({
            data: {
              name: suggestion.suggestion,
              userId,
              color: '#4f46e5'
            }
          });
        }

        // Add tag to file
        await prisma.fileTag.create({
          data: {
            fileId: suggestion.fileId,
            tagId: tag.id
          }
        });
        break;

      case 'rename':
        await prisma.file.update({
          where: { id: suggestion.fileId },
          data: { originalName: suggestion.suggestion }
        });
        break;

      case 'folder':
        // Create folder structure
        const folderPath = suggestion.suggestion.split('/');
        let parentId: string | null = null;

        for (const folderName of folderPath) {
          let folder = await prisma.folder.findFirst({
            where: { name: folderName, userId, parentId }
          });

          if (!folder) {
            folder = await prisma.folder.create({
              data: {
                name: folderName,
                userId,
                parentId
              }
            });
          }

          parentId = folder.id;
        }

        // Move file to folder
        await prisma.file.update({
          where: { id: suggestion.fileId },
          data: { folderId: parentId }
        });
        break;

      default:
        return res.status(400).json({ error: 'Unknown suggestion type' });
    }

    // Mark suggestion as applied
    await prisma.aISuggestion.update({
      where: { id: suggestionId },
      data: { applied: true }
    });

    // Log the action
    await prisma.log.create({
      data: {
        userId,
        action: 'ai_suggestion_applied',
        details: `Applied AI suggestion: ${suggestion.type} - ${suggestion.suggestion}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ message: 'Suggestion applied successfully' });
  } catch (error) {
    console.error('Apply suggestion error:', error);
    res.status(500).json({ error: 'Failed to apply suggestion' });
  }
};

export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.aICategory.findMany({
      include: {
        _count: {
          select: { files: true }
        }
      },
      orderBy: { priority: 'asc' }
    });

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
};

export const getFilesByCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId } = req.params;
    const userId = req.userId!;

    const files = await prisma.file.findMany({
      where: { 
        userId, 
        aiCategoryId: categoryId,
        isDeleted: false 
      },
      include: {
        aiCategory: true,
        tags: {
          include: { tag: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ files });
  } catch (error) {
    console.error('Get files by category error:', error);
    res.status(500).json({ error: 'Failed to get files by category' });
  }
};

export const getFolderSuggestions = async (req: AuthRequest, res: Response) => {
  try {
    const { folderId } = req.params;
    const userId = req.userId!;

    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId },
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Detect folder purpose
    const folderPurpose = detectFolderPurpose(folder.name);
    
    if (!folderPurpose) {
      return res.json({ 
        message: 'No folder pattern detected',
        suggestions: [] 
      });
    }

    // Find matching files
    const matchingFiles = await findMatchingFiles(
      userId, 
      folderId, 
      folderPurpose.purpose, 
      folderPurpose.pattern
    );

    // Create suggestions for moving files
    const suggestions = matchingFiles.map(file => ({
      type: 'move_to_folder',
      suggestion: `Move ${file.originalName} to ${folder.name}`,
      details: {
        fileId: file.id,
        fileName: file.originalName,
        targetFolderId: folderId,
        targetFolderName: folder.name,
        reason: `File matches ${folderPurpose.purpose} pattern`
      },
      confidence: folderPurpose.confidence
    }));

    res.json({ 
      folderPurpose: folderPurpose.purpose,
      confidence: folderPurpose.confidence,
      matchingFilesCount: matchingFiles.length,
      suggestions 
    });
  } catch (error) {
    console.error('Get folder suggestions error:', error);
    res.status(500).json({ error: 'Failed to get folder suggestions' });
  }
};

export const applyFolderSuggestion = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId, targetFolderId } = req.body;
    const userId = req.userId!;

    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, isDeleted: false },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const folder = await prisma.folder.findFirst({
      where: { id: targetFolderId, userId },
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Move file to folder
    await prisma.file.update({
      where: { id: fileId },
      data: { folderId: targetFolderId }
    });

    // Log the action
    await prisma.log.create({
      data: {
        userId,
        action: 'ai_folder_organization',
        details: `Moved ${file.originalName} to ${folder.name} based on AI suggestion`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ message: 'File moved successfully' });
  } catch (error) {
    console.error('Apply folder suggestion error:', error);
    res.status(500).json({ error: 'Failed to apply folder suggestion' });
  }
};

export const getAllFolderSuggestions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Get all user folders
    const folders = await prisma.folder.findMany({
      where: { userId },
    });

    const allSuggestions = [];

    for (const folder of folders) {
      const folderPurpose = detectFolderPurpose(folder.name);
      
      if (folderPurpose) {
        const matchingFiles = await findMatchingFiles(
          userId, 
          folder.id, 
          folderPurpose.purpose, 
          folderPurpose.pattern
        );

        if (matchingFiles.length > 0) {
          allSuggestions.push({
            folderId: folder.id,
            folderName: folder.name,
            purpose: folderPurpose.purpose,
            confidence: folderPurpose.confidence,
            matchingFilesCount: matchingFiles.length,
            matchingFiles: matchingFiles.map(f => ({
              id: f.id,
              name: f.originalName,
              size: f.size,
              mimeType: f.mimeType
            }))
          });
        }
      }
    }

    // Sort by number of matching files
    allSuggestions.sort((a, b) => b.matchingFilesCount - a.matchingFilesCount);

    res.json({ suggestions: allSuggestions });
  } catch (error) {
    console.error('Get all folder suggestions error:', error);
    res.status(500).json({ error: 'Failed to get folder suggestions' });
  }
};