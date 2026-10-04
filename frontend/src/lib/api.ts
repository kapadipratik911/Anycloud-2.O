import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Folder API
export const folderApi = {
  create: (data: { name: string; parentId?: string | null }) => api.post('/folders', data),
  rename: (folderId: string, name: string) => api.put(`/folders/${folderId}/rename`, { name }),
  move: (folderId: string, newParentId: string | null) => api.put(`/folders/${folderId}/move`, { newParentId }),
  delete: (folderId: string) => api.delete(`/folders/${folderId}`),
  get: (parentId?: string | null) => api.get('/folders', { params: { parentId } }),
  getTree: () => api.get('/folders/tree'),
};

// File API
export const fileApi = {
  upload: (formData: FormData, folderId?: string) => {
    if (folderId) {
      formData.append('folderId', folderId);
    }
    return api.post('/files/upload', formData);
  },
  get: (folderId?: string | null) => {
    if (folderId) {
      return api.get('/files', { params: { folderId } });
    }
    return api.get('/files');
  },
  download: (fileId: string) => api.get(`/files/download/${fileId}`, { responseType: 'blob' }),
  preview: (fileId: string) => api.get(`/files/preview/${fileId}`, { responseType: 'blob' }),
  thumbnail: (fileId: string) => api.get(`/files/thumbnail/${fileId}`, { responseType: 'blob' }),
  rename: (fileId: string, newName: string) => api.put(`/files/${fileId}/rename`, { newName }),
  move: (fileId: string, newFolderId: string | null) => api.put(`/files/${fileId}/move`, { newFolderId }),
  delete: (fileId: string) => api.delete(`/files/${fileId}`),
  getTrash: () => api.get('/files/trash'),
  restore: (fileId: string) => api.post(`/files/trash/${fileId}/restore`),
  permanentDelete: (fileId: string) => api.delete(`/files/trash/${fileId}/permanent`),
};

// File Version API
export const fileVersionApi = {
  create: (fileId: string, formData: FormData) => api.post(`/file-versions/${fileId}/versions`, formData),
  get: (fileId: string) => api.get(`/file-versions/${fileId}/versions`),
  rollback: (fileId: string, versionId: string) => api.post(`/file-versions/${fileId}/versions/${versionId}/rollback`),
  delete: (fileId: string, versionId: string) => api.delete(`/file-versions/${fileId}/versions/${versionId}`),
};

// File Comment API
export const fileCommentApi = {
  create: (fileId: string, content: string) => api.post(`/file-comments/${fileId}/comments`, { content }),
  get: (fileId: string) => api.get(`/file-comments/${fileId}/comments`),
  update: (commentId: string, content: string) => api.put(`/file-comments/comments/${commentId}`, { content }),
  delete: (commentId: string) => api.delete(`/file-comments/comments/${commentId}`),
};

// Tag API
export const tagApi = {
  create: (name: string, color?: string) => api.post('/tags', { name, color }),
  get: () => api.get('/tags'),
  update: (tagId: string, name?: string, color?: string) => api.put(`/tags/${tagId}`, { name, color }),
  delete: (tagId: string) => api.delete(`/tags/${tagId}`),
  addToFile: (fileId: string, tagId: string) => api.post('/tags/file-tag', { fileId, tagId }),
  removeFromFile: (fileId: string, tagId: string) => api.delete(`/tags/file-tag/${fileId}/${tagId}`),
  getFileTags: (fileId: string) => api.get(`/tags/file/${fileId}`),
};

// Favorite API
export const favoriteApi = {
  add: (fileId: string) => api.post(`/favorites/${fileId}`),
  remove: (fileId: string) => api.delete(`/favorites/${fileId}`),
  get: () => api.get('/favorites'),
  getRecent: () => api.get('/favorites/recent'),
};

// Bulk API
export const bulkApi = {
  delete: (fileIds: string[]) => api.post('/bulk/delete', { fileIds }),
  move: (fileIds: string[], newFolderId: string | null) => api.post('/bulk/move', { fileIds, newFolderId }),
  download: (fileIds: string[]) => api.post('/bulk/download', { fileIds }, { responseType: 'blob' }),
  addTags: (fileIds: string[], tagIds: string[]) => api.post('/bulk/tags/add', { fileIds, tagIds }),
  removeTags: (fileIds: string[], tagIds: string[]) => api.post('/bulk/tags/remove', { fileIds, tagIds }),
};

// AI Organization API
export const aiApi = {
  categorizeFile: (fileId: string) => api.post(`/ai/categorize/${fileId}`),
  categorizeAllFiles: () => api.post('/ai/categorize-all'),
  getSuggestions: (fileId: string) => api.get(`/ai/suggestions/${fileId}`),
  applySuggestion: (suggestionId: string) => api.post(`/ai/suggestions/${suggestionId}/apply`),
  getCategories: () => api.get('/ai/categories'),
  getFilesByCategory: (categoryId: string) => api.get(`/ai/categories/${categoryId}/files`),
  getFolderSuggestions: (folderId: string) => api.get(`/ai/folders/${folderId}/suggestions`),
  getAllFolderSuggestions: () => api.get('/ai/folders/suggestions/all'),
  applyFolderSuggestion: (fileId: string, targetFolderId: string) => api.post('/ai/folders/suggestions/apply', { fileId, targetFolderId }),
};

// Storage Request API
export const storageRequestApi = {
  create: (data: { requestedMb: number; reason?: string }) => api.post('/storage-requests', data),
  getMyRequests: () => api.get('/storage-requests/my-requests'),
  getAllRequests: () => api.get('/storage-requests/all'),
  approve: (requestId: string) => api.put(`/storage-requests/${requestId}/approve`),
  reject: (requestId: string) => api.put(`/storage-requests/${requestId}/reject`),
};

export default api;
