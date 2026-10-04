import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import {
  Upload,
  Download,
  Trash2,
  Share2,
  Search,
  File,
  RefreshCw,
  HardDrive,
  FileText,
  Image,
  Film,
  Archive,
  Folder,
  FolderOpen,
  Star,
  StarOff,
  CheckSquare,
  Square,
  X,
  Eye,
  MoreVertical,
  Sparkles,
  Lightbulb,
  HelpCircle,
} from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import GlassNav from '../components/GlassNav';
import FilePreview from '../components/FilePreview';
import FileDetails from '../components/FileDetails';
import AIOrganizationPanel from '../components/AIOrganizationPanel';
import api, { fileApi, folderApi, favoriteApi, bulkApi, aiApi, storageRequestApi } from '../lib/api';

interface FileItem {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  createdAt: string;
  isFavorite: boolean;
  tags: Array<{ id: string; name: string; color: string }>;
  folderId?: string | null;
}

interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  _count: {
    files: number;
    children: number;
  };
}

interface Storage {
  used: number;
  quota: number;
  percent: number;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.startsWith('video/')) return Film;
  if (mimeType.includes('zip') || mimeType.includes('archive')) return Archive;
  if (mimeType.includes('pdf') || mimeType.includes('text')) return FileText;
  return File;
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [storage, setStorage] = useState<Storage>({ used: 0, quota: 100, percent: 0 });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ id: string; name: string; mimeType: string } | null>(null);
  const [detailsFile, setDetailsFile] = useState<{ id: string; name: string; isFavorite: boolean } | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiPanelFileId, setAiPanelFileId] = useState<string | undefined>(undefined);
  const [aiPanelActiveTab, setAiPanelActiveTab] = useState<'categories' | 'suggestions' | 'folders'>('categories');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showStorageRequestModal, setShowStorageRequestModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFiles();
    fetchFolders();
    fetchStorage();
  }, [currentFolderId]);

  useEffect(() => {
    if (searchQuery) {
      setFilteredFiles(
        files.filter((file) =>
          file.originalName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredFiles(files);
    }
  }, [searchQuery, files]);

  const fetchFiles = async () => {
    try {
      const response = await fileApi.get(currentFolderId);
      setFiles(response.data.files);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await folderApi.get(currentFolderId);
      setFolders(response.data.folders);
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  };

  const fetchStorage = async () => {
    try {
      const response = await api.get('/auth/profile');
      setStorage(response.data.storage);
    } catch (error) {
      console.error('Failed to fetch storage:', error);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      await fileApi.upload(formData, currentFolderId || undefined);
      await fetchFiles();
      await fetchStorage();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Upload failed';
      if (errorMessage.includes('File format not supported')) {
        alert(errorMessage + '\n\nClick the Help icon (?) to see all supported file formats.');
      } else {
        alert(errorMessage);
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (fileId: string, filename: string) => {
    try {
      const response = await fileApi.download(fileId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Download failed');
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Move this file to trash?')) return;
    try {
      await fileApi.delete(fileId);
      await fetchFiles();
      await fetchStorage();
    } catch {
      alert('Delete failed');
    }
  };

  const handleShare = async (fileId: string) => {
    try {
      const response = await api.post('/shares', { fileId });
      console.log('Share response:', response.data);
      const shareUrl = `${window.location.origin}/share/${response.data.token}`;
      
      // Try clipboard API with fallback
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Share link copied to clipboard!');
      } catch (clipboardError) {
        // Fallback: show link in prompt for manual copy
        const manualCopy = prompt('Share link created! Copy it manually:', shareUrl);
        if (manualCopy === null) {
          alert('Share link created but not copied. Link: ' + shareUrl);
        }
      }
    } catch (error: any) {
      console.error('Share error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create share link';
      alert(`Failed to create share link: ${errorMessage}`);
    }
  };

  const handleAICategorize = async (fileId: string) => {
    try {
      const response = await aiApi.categorizeFile(fileId);
      alert(`File categorized as ${response.data.category} with ${Math.round(response.data.confidence * 100)}% confidence`);
      await fetchFiles();
    } catch (error: any) {
      console.error('AI categorize error:', error);
      alert(error.response?.data?.error || 'Failed to categorize file');
    }
  };

  const handleAICategorizeAll = async () => {
    if (!confirm('This will categorize all your uncategorized files using AI. Continue?')) return;
    try {
      const response = await aiApi.categorizeAllFiles();
      alert(`Successfully categorized ${response.data.categorizedCount} files`);
      await fetchFiles();
    } catch (error: any) {
      console.error('AI bulk categorize error:', error);
      alert(error.response?.data?.error || 'Failed to categorize files');
    }
  };

  const handleGetSuggestions = async (fileId: string) => {
    setAiPanelFileId(fileId);
    setShowAIPanel(true);
  };

  const handleToggleFavorite = async (fileId: string, isFavorite: boolean) => {
    try {
      if (isFavorite) {
        await favoriteApi.remove(fileId);
      } else {
        await favoriteApi.add(fileId);
      }
      await fetchFiles();
    } catch {
      alert('Failed to update favorite');
    }
  };

  const handleSelectFile = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedFiles.size} files?`)) return;
    try {
      await bulkApi.delete(Array.from(selectedFiles));
      setSelectedFiles(new Set());
      setShowBulkActions(false);
      await fetchFiles();
      await fetchStorage();
    } catch {
      alert('Bulk delete failed');
    }
  };

  const handleCreateFolder = async () => {
    const name = prompt('Enter folder name:');
    if (!name) return;
    try {
      await folderApi.create({ name, parentId: currentFolderId });
      await fetchFolders();

      // Check if folder name matches a pattern and show AI panel
      const lowerName = name.toLowerCase();
      const patternKeywords = ['document', 'docs', 'pdf', 'word', 'text', 'paper', 'report', 'invoice', 'contract', 'image', 'images', 'photo', 'photos', 'picture', 'pictures', 'img', 'screenshot', 'wallpaper', 'video', 'videos', 'movie', 'movies', 'clip', 'footage', 'recording', 'audio', 'music', 'sound', 'song', 'songs', 'mp3', 'playlist', 'podcast', 'code', 'programming', 'script', 'source', 'dev', 'development', 'project', 'archive', 'zip', 'compressed', 'backup', 'rar', 'spreadsheet', 'excel', 'sheet', 'data', 'table', 'csv', 'presentation', 'slide', 'ppt', 'powerpoint', 'deck'];

      if (patternKeywords.some(keyword => lowerName.includes(keyword))) {
        setAiPanelFileId(undefined);
        setAiPanelActiveTab('folders');
        setShowAIPanel(true);
      }
    } catch {
      alert('Failed to create folder');
    }
  };

  const handleDeleteFolder = async (folderId: string, folderName: string, itemCount: number) => {
    const message = itemCount > 0
      ? `Are you sure you want to delete "${folderName}"? It contains ${itemCount} items which will also be deleted.`
      : `Are you sure you want to delete "${folderName}"?`;

    if (!confirm(message)) {
      return;
    }

    try {
      await folderApi.delete(folderId);
      await fetchFolders();
      await fetchFiles();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete folder');
    }
  };

  const handleNavigateFolder = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setSelectedFiles(new Set());
    setShowBulkActions(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground />
      <GlassNav username={user?.username} onLogout={logout} showAuth={false} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="space-y-6 lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-cyan-400" />
                  <CardTitle className="text-lg">Storage</CardTitle>
                </div>
                <CardDescription>Your cloud usage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={storage.percent} />
                <div className="flex justify-between text-sm text-white/50">
                  <span>{storage.used.toFixed(2)} MB used</span>
                  <span>{storage.quota} MB total</span>
                </div>
                <div className="text-center">
                  <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-lg font-bold text-transparent">
                    {storage.percent.toFixed(1)}%
                  </span>
                  <span className="text-sm text-white/40"> used</span>
                </div>
                <Button
                  className="w-full mt-4"
                  variant="glass"
                  size="sm"
                  onClick={() => setShowStorageRequestModal(true)}
                >
                  Request More Storage
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upload File</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <Button
                  className="w-full"
                  variant="gradient"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? 'Uploading...' : 'Upload File'}
                </Button>
                {uploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} />
                    <p className="text-center text-sm text-white/50">
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button
              className="w-full"
              variant="gradient"
              onClick={() => setShowAIPanel(!showAIPanel)}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {showAIPanel ? 'Hide AI Panel' : 'Show AI Panel'}
            </Button>

            {showAIPanel && (
              <AIOrganizationPanel
                fileId={aiPanelFileId}
                defaultTab={aiPanelActiveTab}
                onClose={() => {
                  setShowAIPanel(false);
                  setAiPanelFileId(undefined);
                }}
              />
            )}
          </div>

          {/* Main Content */}
          <div className="space-y-6 lg:col-span-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <Input
                      type="text"
                      placeholder="Search files..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="glass" size="icon" onClick={handleCreateFolder}>
                    <Folder className="h-4 w-4" />
                  </Button>
                  <Button variant="glass" size="icon" onClick={handleAICategorizeAll} title="AI Categorize All">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {showBulkActions && (
              <Card className="border-yellow-500/50 bg-yellow-500/10">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm">{selectedFiles.size} files selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete All
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => {
                        setSelectedFiles(new Set());
                        setShowBulkActions(false);
                      }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {currentFolderId ? 'Folder Contents' : 'My Files'}
                    </CardTitle>
                    <CardDescription>
                      {filteredFiles.length + folders.length} items
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentFolderId && (
                      <Button variant="glass" size="sm" onClick={() => handleNavigateFolder(null)}>
                        <FolderOpen className="mr-2 h-4 w-4" />
                        Back to Root
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="gradient"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </Button>
                    <Button variant="glass" size="icon" onClick={() => {
                      fetchFiles();
                      fetchFolders();
                    }}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="glass" size="icon" onClick={() => setShowHelpModal(true)}>
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {folders.length === 0 && filteredFiles.length === 0 ? (
                  <div className="py-16 text-center text-white/40">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5">
                      <File className="h-10 w-10 opacity-50" />
                    </div>
                    <p className="text-lg">No files or folders found</p>
                    <p className="mt-1 text-sm">Upload your first file or create a folder to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Folders */}
                    {folders.map((folder) => (
                      <div
                        key={folder.id}
                        className="file-row cursor-pointer"
                        onClick={() => handleNavigateFolder(folder.id)}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-4">
                          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20">
                            <Folder className="h-5 w-5 text-cyan-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-white">
                              {folder.name}
                            </p>
                            <p className="text-sm text-white/40">
                              {folder._count.files} files &bull; {folder._count.children} subfolders
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0 hover:bg-red-500/20 hover:text-red-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFolder(folder.id, folder.name, folder._count.files + folder._count.children);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    {/* Files */}
                    {filteredFiles.map((file) => {
                      const Icon = getFileIcon(file.mimeType);
                      const isSelected = selectedFiles.has(file.id);
                      return (
                        <div key={file.id} className="file-row">
                          <div className="flex min-w-0 flex-1 items-center gap-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 flex-shrink-0"
                              onClick={() => handleSelectFile(file.id)}
                            >
                              {isSelected ? (
                                <CheckSquare className="h-4 w-4 text-cyan-400" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </Button>
                            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20">
                              <Icon className="h-5 w-5 text-cyan-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-white">
                                {file.originalName}
                              </p>
                              <p className="text-sm text-white/40">
                                {formatFileSize(file.size)} &bull;{' '}
                                {new Date(file.createdAt).toLocaleDateString()}
                              </p>
                              {file.tags.length > 0 && (
                                <div className="mt-1 flex gap-1">
                                  {file.tags.map((tag) => (
                                    <span
                                      key={tag.id}
                                      className="px-2 py-0.5 text-xs rounded-full"
                                      style={{ backgroundColor: tag.color + '40', color: tag.color }}
                                    >
                                      {tag.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setPreviewFile({ id: file.id, name: file.originalName, mimeType: file.mimeType })}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDetailsFile({ id: file.id, name: file.originalName, isFavorite: file.isFavorite })}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleFavorite(file.id, file.isFavorite)}
                            >
                              {file.isFavorite ? (
                                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                              ) : (
                                <StarOff className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownload(file.id, file.originalName)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleAICategorize(file.id)}
                              title="AI Categorize"
                            >
                              <Sparkles className="h-4 w-4 text-purple-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleGetSuggestions(file.id)}
                              title="AI Suggestions"
                            >
                              <Lightbulb className="h-4 w-4 text-yellow-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleShare(file.id)}
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(file.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {previewFile && (
        <FilePreview
          fileId={previewFile.id}
          fileName={previewFile.name}
          mimeType={previewFile.mimeType}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="gradient-border max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400">
                    <HelpCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Supported File Types</CardTitle>
                    <CardDescription>File formats you can upload and store</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowHelpModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Image className="h-4 w-4 text-green-400" />
                    Images
                  </h3>
                  <p className="text-sm text-white/70">.png, .jpg, .jpeg, .gif, .bmp, .webp, .svg</p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-400" />
                    Documents
                  </h3>
                  <p className="text-sm text-white/70">.pdf, .txt, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .csv, .rtf, .odt, .ods, .odp, .md</p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Film className="h-4 w-4 text-orange-400" />
                    Videos
                  </h3>
                  <p className="text-sm text-white/70">.mp4, .mov, .avi, .mkv, .webm, .flv, .wmv</p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Archive className="h-4 w-4 text-red-400" />
                    Audio
                  </h3>
                  <p className="text-sm text-white/70">.mp3, .wav, .ogg, .flac, .aac, .m4a</p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Archive className="h-4 w-4 text-purple-400" />
                    Archives
                  </h3>
                  <p className="text-sm text-white/70">.zip, .rar, .7z, .tar, .gz</p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <File className="h-4 w-4 text-cyan-400" />
                    Code
                  </h3>
                  <p className="text-sm text-white/70">.js, .ts, .html, .css, .json, .py, .java, .cpp, .c, .php, .rb, .go</p>
                </div>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm text-white/60">
                  <strong className="text-white">Maximum file size:</strong> 10 GB per file
                </p>
                <p className="text-sm text-white/60 mt-1">
                  <strong className="text-white">Total storage:</strong> 100 MB (can be increased by admin)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {showStorageRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="gradient-border max-w-md w-full mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Request More Storage</CardTitle>
                  <CardDescription>Ask admin to increase your storage quota</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowStorageRequestModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white/70 mb-2 block">
                  Additional Storage (MB)
                </label>
                <Input
                  type="number"
                  placeholder="e.g., 500"
                  min="1"
                  id="storageAmount"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white/70 mb-2 block">
                  Reason (optional)
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Need more space for project files"
                  id="storageReason"
                />
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm text-white/60">
                  <strong className="text-white">Current storage:</strong> {storage.quota} MB
                </p>
                <p className="text-sm text-white/60 mt-1">
                  <strong className="text-white">Used:</strong> {storage.used.toFixed(2)} MB
                </p>
              </div>
              <Button
                className="w-full"
                variant="gradient"
                onClick={async () => {
                  const amountInput = document.getElementById('storageAmount') as HTMLInputElement;
                  const reasonInput = document.getElementById('storageReason') as HTMLInputElement;
                  const requestedMb = parseInt(amountInput?.value || '0');
                  const reason = reasonInput?.value;

                  if (!requestedMb || requestedMb <= 0) {
                    alert('Please enter a valid storage amount');
                    return;
                  }

                  try {
                    await storageRequestApi.create({ requestedMb, reason });
                    alert('Storage request submitted successfully. Admin will review your request.');
                    setShowStorageRequestModal(false);
                    fetchStorage();
                  } catch (error: any) {
                    alert(error.response?.data?.error || 'Failed to submit request');
                  }
                }}
              >
                Submit Request
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      {detailsFile && (
        <FileDetails
          fileId={detailsFile.id}
          fileName={detailsFile.name}
          isFavorite={detailsFile.isFavorite}
          onClose={() => setDetailsFile(null)}
          onUpdate={fetchFiles}
        />
      )}
    </div>
  );
};

export default Dashboard;
