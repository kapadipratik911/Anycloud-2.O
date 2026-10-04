import { Link } from 'react-router-dom';
import { Upload, Share, Shield, Folder, Zap, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import AnimatedBackground from '../components/AnimatedBackground';
import GlassNav from '../components/GlassNav';
import Cloud3D from '../components/Cloud3D';

const features = [
  { icon: Shield, title: 'Secure Storage', desc: 'Encrypted files stored in our cloud infrastructure.', gradient: 'from-violet-500 to-purple-600' },
  { icon: Share, title: 'Easy Sharing', desc: 'Generate shareable links to send files anywhere.', gradient: 'from-cyan-500 to-blue-600' },
  { icon: Folder, title: 'Folder Management', desc: 'Organize files with intuitive folder navigation.', gradient: 'from-fuchsia-500 to-pink-600' },
  { icon: Upload, title: 'Fast Uploads', desc: 'Optimized speeds to get your files stored quickly.', gradient: 'from-amber-500 to-orange-600' },
  { icon: Sparkles, title: 'Access Anywhere', desc: 'Access your files from any device, anywhere.', gradient: 'from-emerald-500 to-teal-600' },
  { icon: Zap, title: 'Modern Tech', desc: 'Built with React, TypeScript, and best practices.', gradient: 'from-indigo-500 to-violet-600' },
];

const Landing = () => {
  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground />
      <GlassNav />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="animate-fade-up text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/70 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              Next-gen cloud storage
            </div>
            <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight lg:text-6xl">
              Store & Share
              <span className="gradient-text block">Your Files Securely</span>
            </h1>
            <p className="mb-10 max-w-xl text-lg text-white/60 lg:text-xl">
              Access documents, photos, and videos from anywhere.
              Your data stays safe with enterprise-grade security.
            </p>
            <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
              <Link to="/register">
                <Button size="lg" variant="gradient">
                  <Zap className="mr-2 h-5 w-5" />
                  Get Started Free
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="glass">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
          <div className="animate-fade-up h-[420px] w-full" style={{ animationDelay: '0.2s' }}>
            <Cloud3D />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mb-14 text-center">
          <h2 className="mb-4 text-3xl font-bold lg:text-4xl">
            Why Choose <span className="gradient-text">ANY CLOUD 2.0</span>?
          </h2>
          <p className="mx-auto max-w-2xl text-white/50">
            Everything you need to store, organize, and share your files in one beautiful platform.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc, gradient }, i) => (
            <Card key={title} className="group" style={{ animationDelay: `${i * 0.1}s` }}>
              <CardHeader>
                <div className={`feature-icon mb-4 bg-gradient-to-br ${gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-7xl px-4 py-10 text-center text-sm text-white/30 sm:px-6">
        <p>&copy; 2026 ANY CLOUD 2.0. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
