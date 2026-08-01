"use client";
import { useEffect, useRef, useCallback } from "react";

// קונפטי דו-כיווני שנורה מהצדדים. פורט מהתבנית המקורית, נקרא בלחיצה על מקום ראשון.
export function useConfetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    return () => {
      if (canvasRef.current) {
        canvasRef.current.remove();
        canvasRef.current = null;
        ctxRef.current = null;
      }
    };
  }, []);

  const launch = useCallback(() => {
    if (!canvasRef.current) {
      const cv = document.createElement("canvas");
      cv.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;pointer-events:none;";
      document.body.appendChild(cv);
      canvasRef.current = cv;
      ctxRef.current = cv.getContext("2d");
    }
    const canvas = canvasRef.current;
    const cx = ctxRef.current;
    if (!canvas || !cx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#ff0000", "#ff6666", "#ffcc00", "#00cc44", "#3399ff", "#ff66cc", "#ffffff", "#ff9900", "#cc00ff", "#00ffcc"];
    const pieces = 540;
    const particles: any[] = [];
    for (let i = 0; i < pieces; i++) {
      const fromLeft = i < pieces / 2;
      particles.push({
        x: fromLeft ? 0 : canvas.width,
        y: canvas.height * 0.3 + Math.random() * canvas.height * 0.4,
        vx: (fromLeft ? 1 : -1) * (8 + Math.random() * 14),
        vy: -(4 + Math.random() * 12),
        color: colors[Math.floor(Math.random() * colors.length)],
        gravity: 0.32, spin: (Math.random() - 0.5) * 0.35,
        angle: Math.random() * Math.PI * 2,
        shape: Math.random() < 0.5 ? "rect" : "circle",
        w: 8 + Math.random() * 10, h: 4 + Math.random() * 6, alpha: 1,
      });
    }
    function frame() {
      cx!.clearRect(0, 0, canvas!.width, canvas!.height);
      particles.forEach((p) => {
        cx!.save(); cx!.globalAlpha = p.alpha;
        cx!.translate(p.x, p.y); cx!.rotate(p.angle);
        cx!.fillStyle = p.color;
        if (p.shape === "rect") cx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        else { cx!.beginPath(); cx!.ellipse(0, 0, p.w / 2, p.h / 2, 0, 0, Math.PI * 2); cx!.fill(); }
        cx!.restore();
        p.x += p.vx; p.y += p.vy;
        p.vy += p.gravity; p.vx *= 0.99;
        p.angle += p.spin; p.alpha -= 0.006;
      });
      for (let i = particles.length - 1; i >= 0; i--) if (particles[i].alpha <= 0) particles.splice(i, 1);
      if (particles.length > 0) requestAnimationFrame(frame);
      else cx!.clearRect(0, 0, canvas!.width, canvas!.height);
    }
    frame();
  }, []);

  return launch;
}
