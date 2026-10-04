import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Sparkles, Lightbulb, Folder, Tag, RefreshCw, ChevronRight, X, FileText, Image, Film, Music, Archive, Code, Table, File } from 'lucide-react';
import { aiApi } from '../lib/api';

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  _count: {
    files: number;
  };
}

interface Suggestion {
  id: string;
  type: string;
  suggestion: string;
  confidence: number;
}

interface FolderSuggestion {
  folderId: string;
  folderName: string;
  purpose: string;
  confidence: number;
  matchingFilesCount: number;
  matchingFiles: Array<{
    id: string;
    name: string;
    size: number;
    mimeType: string;
  }>;
}

const AIOrganizationPanel = ({ fileId, onClose, defaultTab }: { fileId?: string; onClose?: () => void; defaultTab?: 'categories' | 'suggestions' | 'folders' }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [folderSuggestions, setFolderSuggestions] = useState<FolderSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [categorizing, setCategorizing] = useState(false);
  const [activeTab, setActiveTab] = useState<'categories' | 'suggestions' | 'folders'>(defaultTab || 'categories');

  useEffect(() => {
    fetchCategories();
    if (fileId) {
      fetchSuggestions();
    }
    fetchFolderSuggestions();
  }, [fileId]);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  const fetchCategories = async () => {
    try {
      const response = await aiApi.getCategories();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchSuggestions = async () => {
    if (!fileId) return;
    try {
      setLoading(true);
      const response = await aiApi.getSuggestions(fileId);
      setSuggestions(response.data.suggestions);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolderSuggestions = async () => {
    try {
      const response = await aiApi.getAllFolderSuggestions();
      setFolderSuggestions(response.data.suggestions);
    } catch (error) {
      console.error('Failed to fetch folder suggestions:', error);
    }
  };

  const handleCategorizeAll = async () => {
    try {
      setCategorizing(true);
      await aiApi.categorizeAllFiles();
      await fetchCategories();
      alert('All files categorized successfully!');
    } catch (error) {
      console.error('Failed to categorize files:', error);
      alert('Failed to categorize files');
    } finally {
      setCategorizing(false);
    }
  };

  const handleApplySuggestion = async (suggestionId: string) => {
    try {
      await aiApi.applySuggestion(suggestionId);
      setSuggestions(suggestions.filter(s => s.id !== suggestionId));
      await fetchCategories();
      alert('Suggestion applied successfully!');
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
      alert('Failed to apply suggestion');
    }
  };

  const handleApplyFolderSuggestion = async (fileId: string, targetFolderId: string) => {
    try {
      await aiApi.applyFolderSuggestion(fileId, targetFolderId);
      await fetchFolderSuggestions();
      alert('File moved successfully!');
    } catch (error) {
      console.error('Failed to apply folder suggestion:', error);
      alert('Failed to move file');
    }
  };

  const handleApplyAllFolderSuggestions = async (folderSuggestion: FolderSuggestion) => {
    if (!confirm(`Move all ${folderSuggestion.matchingFilesCount} files to ${folderSuggestion.folderName}?`)) return;
    
    try {
      for (const file of folderSuggestion.matchingFiles) {
        await aiApi.applyFolderSuggestion(file.id, folderSuggestion.folderId);
      }
      await fetchFolderSuggestions();
      alert(`Successfully moved ${folderSuggestion.matchingFilesCount} files to ${folderSuggestion.folderName}!`);
    } catch (error) {
      console.error('Failed to apply folder suggestions:', error);
      alert('Failed to move some files');
    }
  };

  const getCategoryIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      'file-text': FileText,
      'image': Image,
      'film': Film,
      'music': Music,
      'archive': Archive,
      'code': Code,
      'table': Table,
      'presentation': File,
      'file': File,
    };
    return iconMap[iconName] || File;
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'folder': return Folder;
      case 'tag': return Tag;
      case 'rename': return RefreshCw;
      default: return Lightbulb;
    }
  };

  return (
    <Card className="gradient-border overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-400">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg truncate">AI Organization</CardTitle>
              <CardDescription className="text-xs">Smart file management</CardDescription>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="max-h-[600px] overflow-y-auto px-4 pb-4">
        {/* Tab Navigation */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant={activeTab === 'categories' ? 'gradient' : 'glass'}
            onClick={() => setActiveTab('categories')}
            className="text-xs"
          >
            <Folder className="mr-1.5 h-3.5 w-3.5" />
            Categories
          </Button>
          {fileId && (
            <Button
              size="sm"
              variant={activeTab === 'suggestions' ? 'gradient' : 'glass'}
              onClick={() => setActiveTab('suggestions')}
              className="text-xs"
            >
              <Lightbulb className="mr-1.5 h-3.5 w-3.5" />
              Suggestions
            </Button>
          )}
          <Button
            size="sm"
            variant={activeTab === 'folders' ? 'gradient' : 'glass'}
            onClick={() => setActiveTab('folders')}
            className="text-xs"
          >
            <Folder className="mr-1.5 h-3.5 w-3.5" />
            Folders
          </Button>
        </div>

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold">File Categories</h3>
                <p className="text-xs text-white/50">Auto-categorized by AI</p>
              </div>
              <Button
                size="sm"
                variant="gradient"
                onClick={handleCategorizeAll}
                disabled={categorizing}
                className="flex-shrink-0 text-xs"
              >
                {categorizing ? (
                  <>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Processing
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Categorize
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-1.5">
              {categories.map((category) => {
                const Icon = getCategoryIcon(category.icon);
                return (
                  <div
                    key={category.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-2"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: category.color + '20' }}
                      >
                        <Icon className="h-4 w-4" style={{ color: category.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-white truncate">{category.name}</p>
                        <p className="text-[10px] text-white/50 truncate">{category.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      <span className="text-xs font-semibold" style={{ color: category.color }}>
                        {category._count.files}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold">AI Suggestions</h3>
                <p className="text-xs text-white/50">Smart recommendations</p>
              </div>
              <Button
                size="sm"
                variant="glass"
                onClick={fetchSuggestions}
                disabled={loading}
                className="flex-shrink-0 text-xs"
              >
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-6">
                <RefreshCw className="h-6 w-6 animate-spin text-purple-400" />
              </div>
            ) : suggestions.length === 0 ? (
              <div className="py-6 text-center text-white/40">
                <Lightbulb className="mx-auto mb-2 h-6 w-6 opacity-50" />
                <p className="text-xs">No suggestions available</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {suggestions.map((suggestion) => {
                  const Icon = getSuggestionIcon(suggestion.type);
                  return (
                    <div
                      key={suggestion.id}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-2"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-yellow-500/20">
                          <Icon className="h-4 w-4 text-yellow-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-semibold uppercase text-white/50">
                              {suggestion.type}
                            </span>
                            <Progress value={suggestion.confidence * 100} className="h-0.5 flex-1" />
                            <span className="text-[10px] text-white/50">
                              {Math.round(suggestion.confidence * 100)}%
                            </span>
                          </div>
                          <p className="text-xs text-white truncate">{suggestion.suggestion}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="gradient"
                        onClick={() => handleApplySuggestion(suggestion.id)}
                        className="flex-shrink-0 ml-2 text-xs"
                      >
                        Apply
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Folder Suggestions Tab */}
        {activeTab === 'folders' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold">Smart Folder Sort</h3>
                <p className="text-xs text-white/50">AI suggests file organization</p>
              </div>
              <Button
                size="sm"
                variant="glass"
                onClick={fetchFolderSuggestions}
                disabled={loading}
                className="flex-shrink-0 text-xs"
              >
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {folderSuggestions.length === 0 ? (
              <div className="py-6 text-center text-white/40">
                <Folder className="mx-auto mb-2 h-6 w-6 opacity-50" />
                <p className="text-xs">No folder suggestions</p>
                <p className="text-[10px] text-white/30">Create folders like "Documents", "Images"</p>
              </div>
            ) : (
              <div className="space-y-2">
                {folderSuggestions.map((folderSuggestion) => (
                  <div
                    key={folderSuggestion.folderId}
                    className="rounded-lg border border-white/10 bg-white/5 p-2.5"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-purple-500/20">
                          <Folder className="h-3.5 w-3.5 text-purple-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-white truncate">{folderSuggestion.folderName}</p>
                          <p className="text-[10px] text-white/50 truncate">
                            {Math.round(folderSuggestion.confidence * 100)}% • {folderSuggestion.matchingFilesCount} files
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-2 space-y-0.5">
                      {folderSuggestion.matchingFiles.slice(0, 2).map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between rounded bg-white/5 px-2 py-1 text-xs"
                        >
                          <span className="truncate text-white/70 pr-2">{file.name}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleApplyFolderSuggestion(file.id, folderSuggestion.folderId)}
                            className="h-6 w-6 p-0 flex-shrink-0"
                          >
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {folderSuggestion.matchingFiles.length > 2 && (
                        <p className="text-center text-[10px] text-white/40">
                          +{folderSuggestion.matchingFiles.length - 2} more
                        </p>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="gradient"
                      className="w-full text-xs"
                      onClick={() => handleApplyAllFolderSuggestions(folderSuggestion)}
                    >
                      <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                      Move All
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIOrganizationPanel;