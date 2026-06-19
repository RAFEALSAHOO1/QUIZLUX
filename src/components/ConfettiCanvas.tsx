import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

export default function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const colors = ["#6C63FF", "#00D4FF", "#FFD700", "#FF4081", "#4CAF50", "#FF9800"];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Seed initial particles
    const createParticle = (x: number, y: number, isExplosion = false): Particle => {
      const size = Math.random() * 8 + 4;
      return {
        x,
        y,
        size,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: isExplosion ? (Math.random() - 0.5) * 15 : (Math.random() - 0.5) * 4,
        speedY: isExplosion ? Math.random() * -12 - 5 : Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 5,
        opacity: 1
      };
    };

    // Spawn initial bursts at the bottom corners and top center
    const spawnInitialBursts = () => {
      const parentWidth = canvas.width;
      const parentHeight = canvas.height;

      // Left corner shooting up-right
      for (let i = 0; i < 60; i++) {
        const p = createParticle(0, parentHeight, true);
        p.speedX = Math.random() * 12 + 4; // strictly positive
        particles.push(p);
      }

      // Right corner shooting up-left
      for (let i = 0; i < 60; i++) {
        const p = createParticle(parentWidth, parentHeight, true);
        p.speedX = (Math.random() * 12 + 4) * -1; // strictly negative
        particles.push(p);
      }

      // Top falling down continuous
      for (let i = 0; i < 80; i++) {
        particles.push(createParticle(Math.random() * parentWidth, -20, false));
      }
    };

    spawnInitialBursts();

    // Constant trickle
    const trickleIntervalId = setInterval(() => {
      if (particles.length < 250) {
        particles.push(createParticle(Math.random() * canvas.width, -10, false));
      }
    }, 100);

    // Frame update loop
    const update = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Apply physical dynamics
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;
        
        // Gravity
        p.speedY += 0.12; 
        // Horizontal deceleration
        p.speedX *= 0.98;

        // Fade out as it descends near bottom or after lifetime
        if (p.y > canvas.height - 100) {
          p.opacity -= 0.015;
        }

        if (p.opacity <= 0 || p.x < -50 || p.x > canvas.width + 50 || p.y > canvas.height + 50) {
          particles.splice(i, 1);
          continue;
        }

        // Draw particle
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;

        // Draw a neat diamond or rectangle
        if (p.size % 2 === 0) {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else {
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.lineTo(p.size, 0);
          ctx.lineTo(0, p.size);
          ctx.lineTo(-p.size, 0);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(update);
    };

    update();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      clearInterval(trickleIntervalId);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-40"
    />
  );
}
