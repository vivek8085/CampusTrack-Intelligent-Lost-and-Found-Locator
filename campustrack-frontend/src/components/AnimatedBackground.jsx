import React, { useEffect, useRef } from 'react';
import './AnimatedBackground.css';

export default function AnimatedBackground({ color = '#5eead4' }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let width = 0;
    let height = 0;
    let dpr = Math.max(1, window.devicePixelRatio || 1);

    function resize() {
      dpr = Math.max(1, window.devicePixelRatio || 1);
      width = canvas.clientWidth || window.innerWidth;
      height = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    }

    function initParticles() {
      const area = width * height;
      const count = Math.max(18, Math.floor(area / 16000));
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          r: 0.6 + Math.random() * 2,
          alpha: 0.15 + Math.random() * 0.6
        });
      }
    }

    let px = 0,
      py = 0;

    function step() {
      ctx.clearRect(0, 0, width, height);

      // soft gradient background
      const g = ctx.createLinearGradient(0, 0, width, height);
      g.addColorStop(0, 'rgba(7,89,133,0.06)');
      g.addColorStop(0.5, 'rgba(56,189,248,0.03)');
      g.addColorStop(1, 'rgba(14,165,233,0.02)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);

      // gentle parallax offset derived from mouse
      const mx = (mouseRef.current.x - 0.5) * 30; // -15..15
      const my = (mouseRef.current.y - 0.5) * 30;
      // smooth the motion
      px += (mx - px) * 0.06;
      py += (my - py) * 0.06;
      canvas.style.transform = `translate(${px}px, ${py}px)`;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx + (px * 0.002 * (p.r));
        p.y += p.vy + (py * 0.002 * (p.r));

        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        ctx.beginPath();
        ctx.fillStyle = `rgba(94,234,212,${p.alpha})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            const a = (1 - dist / 120) * 0.18;
            ctx.strokeStyle = `rgba(94,234,212,${a})`;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(step);
    }

    function onMouse(e) {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = (e.clientX - rect.left) / rect.width;
      mouseRef.current.y = (e.clientY - rect.top) / rect.height;
    }

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouse);
    rafRef.current = requestAnimationFrame(step);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [color]);

  return (
    <div className="animated-bg" aria-hidden>
      <canvas ref={canvasRef} className="animated-bg-canvas" />
    </div>
  );
}
