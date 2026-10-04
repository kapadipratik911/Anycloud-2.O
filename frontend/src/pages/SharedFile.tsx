import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Cloud, Download, AlertCircle, Loader2 } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';

const SharedFile = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid share link');
      setLoading(false);
      return;
    }

    const fetchSharedFile = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        const response = await fetch(`${apiUrl}/shares/share/${token}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('This share link is invalid or has expired');
          } else {
            setError('Failed to load shared file');
          }
          setLoading(false);
          return;
        }

        // Get the filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'download';
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
        setFileName(filename);

        // Create blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to download shared file');
        setLoading(false);
      }
    };

    fetchSharedFile();
  }, [token]);

  const handleDownload = () => {
    if (!token) return;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    window.location.href = `${apiUrl}/shares/share/${token}`;
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 text-white">
      <AnimatedBackground />
      <Card className="authenticate-fade-up w-full max-w-md gradient-border">
        <CardHeader className="space-y-1">
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400">
              <Cloud className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold">ANY CLOUD 2.0</span>
          </div>
          <CardTitle className="text-center text-2xl">Shared File</CardTitle>
          <CardDescription className="text-center">
            {loading ? 'Preparing your download...' : fileName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
              <p className="mt-4 text-sm text-white/60">Downloading file...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <p className="text-center text-sm text-white/60">{error}</p>
              <Button
                onClick={() => navigate('/')}
                className="mt-6"
                variant="gradient"
              >
                Go to Home
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                <Download className="h-8 w-8 text-green-400" />
              </div>
              <p className="text-center text-sm text-white/60">
                Your download should start automatically
              </p>
              <Button
                onClick={handleDownload}
                className="mt-6"
                variant="gradient"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Again
              </Button>
              <Button
                onClick={() => navigate('/')}
                className="mt-4"
                variant="ghost"
              >
                Go to Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SharedFile;
