import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  opacityDelta: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
}

export const SpaceCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastFrameTime = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      nebulae[0].x = width * 0.2;
      nebulae[0].y = height * 0.25;
      nebulae[0].radius = Math.max(width, height) * 0.45;
      nebulae[1].x = width * 0.85;
      nebulae[1].y = height * 0.7;
      nebulae[1].radius = Math.max(width, height) * 0.5;
      nebulae[2].x = width * 0.5;
      nebulae[2].y = height * 0.9;
      nebulae[2].radius = Math.max(width, height) * 0.4;
    };

    // Nebula hubs
    const nebulae = [
      { x: width * 0.2, y: height * 0.25, radius: Math.max(width, height) * 0.45, color: 'rgba(138, 43, 226, 0.08)' },
      { x: width * 0.85, y: height * 0.7, radius: Math.max(width, height) * 0.5, color: 'rgba(176, 38, 255, 0.07)' },
      { x: width * 0.5, y: height * 0.9, radius: Math.max(width, height) * 0.4, color: 'rgba(75, 0, 130, 0.09)' },
    ];

    // Generate stars
    const starColors = ['#FFFFFF', '#D8B4FE', '#C084FC', '#E9D5FF', '#A855F7'];
    const stars: Star[] = Array.from({ length: isMobile ? 72 : 180 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.8 + 0.4,
      speed: Math.random() * 0.05 + 0.02,
      opacity: Math.random() * 0.8 + 0.2,
      opacityDelta: (Math.random() * 0.015 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
      color: starColors[Math.floor(Math.random() * starColors.length)],
    }));

    // Floating void ore micro-particles
    const particles: Particle[] = Array.from({ length: isMobile ? 14 : 35 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.5 + 1,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25 - 0.1,
      alpha: Math.random() * 0.6 + 0.2,
      color: Math.random() > 0.4 ? '#B026FF' : '#8A2BE2',
    }));

    // Shooting star
    let shootingStar: { x: number; y: number; length: number; speed: number; angle: number; alpha: number } | null = null;
    let nextShootingStarTime = Date.now() + 3000 + Math.random() * 5000;

    const render = (timestamp = 0) => {
      if (document.hidden) return;
      if (isMobile && timestamp - lastFrameTime < 32) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      lastFrameTime = timestamp;
      ctx.clearRect(0, 0, width, height);

      // Deep space base fill
      ctx.fillStyle = '#050507';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle nebula clouds
      nebulae.forEach((nebula) => {
        const gradient = ctx.createRadialGradient(nebula.x, nebula.y, 0, nebula.x, nebula.y, nebula.radius);
        gradient.addColorStop(0, nebula.color);
        gradient.addColorStop(0.5, 'rgba(110, 25, 200, 0.03)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw and update stars
      stars.forEach((star) => {
        star.opacity += star.opacityDelta;
        if (star.opacity > 1) {
          star.opacity = 1;
          star.opacityDelta = -Math.abs(star.opacityDelta);
        } else if (star.opacity < 0.2) {
          star.opacity = 0.2;
          star.opacityDelta = Math.abs(star.opacityDelta);
        }

        ctx.fillStyle = star.color;
        ctx.globalAlpha = star.opacity;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Soft star glow for larger stars
        if (star.size > 1.4) {
          ctx.fillStyle = 'rgba(176, 38, 255, 0.3)';
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw and update floating void particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Handle shooting stars
      const now = Date.now();
      if (!shootingStar && now > nextShootingStarTime) {
        shootingStar = {
          x: Math.random() * width * 0.8,
          y: Math.random() * height * 0.4,
          length: Math.random() * 80 + 40,
          speed: Math.random() * 8 + 12,
          angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
          alpha: 1,
        };
        nextShootingStarTime = now + 6000 + Math.random() * 10000;
      }

      if (shootingStar) {
        const dx = Math.cos(shootingStar.angle) * shootingStar.length;
        const dy = Math.sin(shootingStar.angle) * shootingStar.length;

        const grad = ctx.createLinearGradient(
          shootingStar.x,
          shootingStar.y,
          shootingStar.x - dx,
          shootingStar.y - dy
        );
        grad.addColorStop(0, `rgba(255, 255, 255, ${shootingStar.alpha})`);
        grad.addColorStop(0.3, `rgba(176, 38, 255, ${shootingStar.alpha * 0.8})`);
        grad.addColorStop(1, 'rgba(138, 43, 226, 0)');

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(shootingStar.x, shootingStar.y);
        ctx.lineTo(shootingStar.x - dx, shootingStar.y - dy);
        ctx.stroke();

        shootingStar.x += Math.cos(shootingStar.angle) * shootingStar.speed;
        shootingStar.y += Math.sin(shootingStar.angle) * shootingStar.speed;
        shootingStar.alpha -= 0.015;

        if (shootingStar.alpha <= 0 || shootingStar.x > width || shootingStar.y > height) {
          shootingStar = null;
        }
      }

      ctx.globalAlpha = 1;
      if (!reducedMotion.matches) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
      } else {
        render();
      }
    };

    const handleMotionChange = () => {
      cancelAnimationFrame(animationFrameId);
      render();
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    reducedMotion.addEventListener('change', handleMotionChange);
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      reducedMotion.removeEventListener('change', handleMotionChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: '#050507' }}
    />
  );
};
