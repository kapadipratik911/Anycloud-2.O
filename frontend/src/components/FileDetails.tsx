import { useState, useEffect } from 'react';
import { X, MessageSquare, Tag, Plus, Trash2, Send, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { fileCommentApi, tagApi, favoriteApi } from '../lib/api';

interface FileDetailsProps {
  fileId: string;
  fileName: string;
  isFavorite: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
  };
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

const FileDetails = ({ fileId, fileName, isFavorite, onClose, onUpdate }: FileDetailsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [tags, setTags] = useState<Tag[]>([]);
  const [fileTags, setFileTags] = useState<Tag[]>([]);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#4f46e5');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
    fetchTags();
    fetchFileTags();
  }, [fileId]);

  const fetchComments = async () => {
    try {
      const response = await fileCommentApi.get(fileId);
      setComments(response.data.comments);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await tagApi.get();
      setTags(response.data.tags);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const fetchFileTags = async () => {
    try {
      const response = await tagApi.getFileTags(fileId);
      setFileTags(response.data.tags);
    } catch (error) {
      console.error('Failed to fetch file tags:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await fileCommentApi.create(fileId, newComment);
      setNewComment('');
      await fetchComments();
    } catch (error) {
      alert('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await fileCommentApi.delete(commentId);
      await fetchComments();
    } catch (error) {
      alert('Failed to delete comment');
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      await tagApi.create(newTagName, newTagColor);
      setNewTagName('');
      setNewTagColor('#4f46e5');
      await fetchTags();
      setShowTagDialog(false);
    } catch (error) {
      alert('Failed to create tag');
    }
  };

  const handleAddTagToFile = async (tagId: string) => {
    try {
      await tagApi.addToFile(fileId, tagId);
      await fetchFileTags();
      onUpdate();
    } catch (error) {
      alert('Failed to add tag to file');
    }
  };

  const handleRemoveTagFromFile = async (tagId: string) => {
    try {
      await tagApi.removeFromFile(fileId, tagId);
      await fetchFileTags();
      onUpdate();
    } catch (error) {
      alert('Failed to remove tag from file');
    }
  };

  const handleToggleFavorite = async () => {
    try {
      if (isFavorite) {
        await favoriteApi.remove(fileId);
      } else {
        await favoriteApi.add(fileId);
      }
      onUpdate();
    } catch (error) {
      alert('Failed to update favorite');
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-900/95 backdrop-blur-sm border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="truncate">{fileName}</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Favorite Toggle */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <Button
                variant={isFavorite ? "default" : "outline"}
                onClick={handleToggleFavorite}
                className="w-full"
              >
                <Star className={`mr-2 h-4 w-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </Button>
            </CardContent>
          </Card>

          {/* Tags Section */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Tag className="h-5 w-5 text-cyan-400" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {fileTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center gap-1 px-3 py-1 rounded-full"
                    style={{ backgroundColor: tag.color + '40', color: tag.color }}
                  >
                    <span className="text-sm">{tag.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 hover:bg-white/20"
                      onClick={() => handleRemoveTagFromFile(tag.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <select
                  className="flex-1 rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  onChange={(e) => e.target.value && handleAddTagToFile(e.target.value)}
                  value=""
                >
                  <option value="">Add existing tag...</option>
                  {tags
                    .filter((tag) => !fileTags.some((ft) => ft.id === tag.id))
                    .map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                </select>
                <Button variant="outline" onClick={() => setShowTagDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Tag
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5 text-cyan-400" />
                Comments ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                />
                <Button onClick={handleAddComment}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-center text-sm text-white/40 py-4">No comments yet</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="rounded-lg bg-white/5 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-cyan-400">
                          {comment.user.username}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/40">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <Trash2 className="h-3 w-3 text-red-400" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-white/80">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>

      {/* Create Tag Dialog */}
      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent className="bg-gray-900/95 backdrop-blur-sm border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Tag name"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="bg-white/5 border-white/20 text-white"
            />
            <div className="flex items-center gap-2">
              <label className="text-sm text-white/60">Color:</label>
              <input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="h-8 w-16 rounded cursor-pointer"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowTagDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTag}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default FileDetails;
