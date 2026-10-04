import { useState, useEffect } from 'react';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { fileApi } from '../lib/api';

interface FilePreviewProps {
  fileId: string;
  fileName: string;
  mimeType: string;
  onClose: () => void;
}

const FilePreview = ({ fileId, fileName, mimeType, onClose }: FilePreviewProps) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadPreview = async () => {
      try {
        setLoading(true);
        setError(false);
        const response = await fileApi.preview(fileId);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        setPreviewUrl(url);
      } catch (err) {
        console.error('Failed to load preview:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadPreview();

    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [fileId]);

  const handleDownload = async () => {
    try {
      const response = await fileApi.download(fileId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Download failed');
    }
  };

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent"></div>
            <p className="text-white/60">Loading preview...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <p className="text-white/60">Preview not available for this file type</p>
            <Button onClick={handleDownload} className="mt-4">
              <Download className="mr-2 h-4 w-4" />
              Download File
            </Button>
          </div>
        </div>
      );
    }

    if (mimeType.startsWith('image/')) {
      return (
        <div className="flex h-96 items-center justify-center bg-black/20">
          <img
            src={previewUrl}
            alt={fileName}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      );
    }

    if (mimeType.startsWith('video/')) {
      return (
        <div className="flex h-96 items-center justify-center bg-black/20">
          <video
            src={previewUrl}
            controls
            className="max-h-full max-w-full"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (mimeType === 'application/pdf') {
      return (
        <div className="h-96">
          <iframe
            src={previewUrl}
            className="h-full w-full"
            title={fileName}
          />
        </div>
      );
    }

    if (mimeType.startsWith('text/')) {
      return (
        <div className="h-96 overflow-auto bg-black/20 p-4">
          <pre className="text-sm text-white/80 whitespace-pre-wrap">{previewUrl}</pre>
        </div>
      );
    }

    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <p className="text-white/60">Preview not available for this file type</p>
          <Button onClick={handleDownload} className="mt-4">
            <Download className="mr-2 h-4 w-4" />
            Download File
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <Card className="w-full max-w-4xl bg-gray-900/95 backdrop-blur-sm border-white/10">
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <h3 className="truncate text-lg font-semibold text-white">{fileName}</h3>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="p-4">
          {renderPreview()}
        </div>
      </Card>
    </div>
  );
};

export default FilePreview;
