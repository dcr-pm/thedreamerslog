import React, { useEffect, useRef } from 'react';

/** Twinkling starfield rendered on canvas */
const Starfield: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const stars: { x: number; y: number; r: number; phase: number; speed: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const init = () => {
      resize();
      stars.length = 0;
      const count = Math.floor((canvas.width * canvas.height) / 8000);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.5 + 0.3,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.02 + 0.005,
        });
      }
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const star of stars) {
        const opacity = 0.3 + 0.7 * ((Math.sin(time * star.speed + star.phase) + 1) / 2);
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      }
      animationId = requestAnimationFrame(draw);
    };

    init();
    animationId = requestAnimationFrame(draw);
    window.addEventListener('resize', init);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', init);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none -z-20"
      aria-hidden="true"
    />
  );
};

/** Floating orbs that drift slowly */
const FloatingOrbs: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden="true">
      {/* Aurora bands */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[50%] bg-gradient-to-br from-dreamy-purple/8 via-dreamy-indigo/5 to-transparent blur-[100px] rounded-full animate-aurora-1" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[50%] bg-gradient-to-tl from-dreamy-indigo/8 via-purple-900/5 to-transparent blur-[100px] rounded-full animate-aurora-2" />

      {/* Floating orbs */}
      <div className="absolute top-[15%] left-[20%] w-2 h-2 bg-dreamy-purple/30 rounded-full blur-[1px] animate-float-1" />
      <div className="absolute top-[40%] right-[15%] w-3 h-3 bg-dreamy-indigo/20 rounded-full blur-[2px] animate-float-2" />
      <div className="absolute bottom-[30%] left-[10%] w-1.5 h-1.5 bg-white/20 rounded-full blur-[1px] animate-float-3" />
      <div className="absolute top-[60%] left-[60%] w-2.5 h-2.5 bg-purple-400/15 rounded-full blur-[2px] animate-float-4" />
      <div className="absolute top-[25%] right-[30%] w-1 h-1 bg-white/30 rounded-full animate-float-5" />
      <div className="absolute bottom-[20%] right-[40%] w-2 h-2 bg-dreamy-purple/20 rounded-full blur-[1px] animate-float-6" />
    </div>
  );
};

const DreamyBackground: React.FC = () => {
  return (
    <>
      <Starfield />
      <FloatingOrbs />
    </>
  );
};

export default DreamyBackground;
