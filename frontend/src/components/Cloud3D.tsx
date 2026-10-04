export default function Cloud3D() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-24px) rotate(5deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); opacity: 0.85; box-shadow: 0 0 80px rgba(139,92,246,0.6), 0 0 120px rgba(6,182,212,0.3); }
          50% { transform: scale(1.08); opacity: 1; box-shadow: 0 0 100px rgba(236,72,153,0.5), 0 0 160px rgba(6,182,212,0.4); }
        }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(140px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(140px) rotate(-360deg); }
        }
        .cloud-container {
          position: relative; width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
        }
        .main-cloud {
          width: 180px; height: 180px;
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 40%, #06b6d4 100%);
          border-radius: 50%;
          animation: float 6s ease-in-out infinite, pulse-glow 4s ease-in-out infinite;
          position: relative;
          backdrop-filter: blur(20px);
        }
        .main-cloud::before {
          content: ''; position: absolute; top: 12%; left: 15%;
          width: 35%; height: 25%;
          background: rgba(255,255,255,0.35); border-radius: 50%; filter: blur(8px);
        }
        .ring {
          position: absolute; border-radius: 50%;
          border: 2px solid transparent;
          background: linear-gradient(135deg, rgba(139,92,246,0.3), rgba(6,182,212,0.3)) border-box;
          -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          animation: rotate 20s linear infinite;
        }
        .ring-1 { width: 260px; height: 260px; animation-duration: 14s; }
        .ring-2 { width: 320px; height: 320px; animation-duration: 20s; animation-direction: reverse; }
        .ring-3 { width: 380px; height: 380px; animation-duration: 28s; opacity: 0.5; }
        .particle {
          position: absolute; border-radius: 50%;
          animation: float 7s ease-in-out infinite;
        }
        .particle-1 { width: 18px; height: 18px; top: 18%; left: 22%; background: #a78bfa; animation-delay: 0s; }
        .particle-2 { width: 14px; height: 14px; top: 28%; right: 22%; background: #22d3ee; animation-delay: 1s; }
        .particle-3 { width: 22px; height: 22px; bottom: 22%; left: 28%; background: #f472b6; animation-delay: 2s; }
        .particle-4 { width: 16px; height: 16px; bottom: 18%; right: 18%; background: #818cf8; animation-delay: 3s; }
        .particle-5 { width: 20px; height: 20px; top: 48%; left: 8%; background: #34d399; animation-delay: 4s; }
        .particle-6 { width: 12px; height: 12px; top: 38%; right: 12%; background: #fbbf24; animation-delay: 5s; }
        .orbit-particle {
          position: absolute; width: 10px; height: 10px;
          border-radius: 50%; animation: orbit 12s linear infinite;
        }
        .orbit-1 { background: #c084fc; animation-delay: 0s; }
        .orbit-2 { background: #22d3ee; animation-delay: -4s; }
        .orbit-3 { background: #fb7185; animation-delay: -8s; }
      `}</style>
      <div className="cloud-container">
        <div className="ring ring-3" />
        <div className="ring ring-2" />
        <div className="ring ring-1" />
        <div className="main-cloud" />
        <div className="particle particle-1" />
        <div className="particle particle-2" />
        <div className="particle particle-3" />
        <div className="particle particle-4" />
        <div className="particle particle-5" />
        <div className="particle particle-6" />
        <div className="orbit-particle orbit-1" />
        <div className="orbit-particle orbit-2" />
        <div className="orbit-particle orbit-3" />
      </div>
    </div>
  );
}
