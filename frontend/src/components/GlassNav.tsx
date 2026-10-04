import { Link } from 'react-router-dom';
import { Cloud, LogOut } from 'lucide-react';
import { Button } from './ui/button';

interface GlassNavProps {
  title?: string;
  username?: string;
  onLogout?: () => void;
  showAuth?: boolean;
}

const GlassNav = ({ title = 'ANY CLOUD 2.0', username, onLogout, showAuth = true }: GlassNavProps) => (
  <nav className="sticky top-0 z-50 mx-auto max-w-7xl px-4 py-4 sm:px-6">
    <div className="glass-nav flex items-center justify-between rounded-2xl px-6 py-3">
      <Link to="/" className="flex items-center gap-2.5 group">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 shadow-lg shadow-violet-500/30 transition-transform group-hover:scale-110">
          <Cloud className="h-5 w-5 text-white" />
        </div>
        <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-xl font-bold tracking-tight text-transparent">
          {title}
        </span>
      </Link>

      <div className="flex items-center gap-3">
        {username && (
          <span className="hidden text-sm text-white/60 sm:block">{username}</span>
        )}
        {onLogout && (
          <Button variant="glass" size="icon" onClick={onLogout} aria-label="Logout">
            <LogOut className="h-4 w-4" />
          </Button>
        )}
        {showAuth && !username && (
          <>
            <Link to="/login">
              <Button variant="glass">Login</Button>
            </Link>
            <Link to="/register">
              <Button variant="gradient">Sign Up</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  </nav>
);

export default GlassNav;
