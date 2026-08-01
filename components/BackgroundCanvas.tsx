"use client";
import { useEffect, useRef } from "react";

// רקע הנורות הזוהרות שעוקב אחרי העכבר. פורט 1:1 מהתבנית המקורית.
export default function BackgroundCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let bulbs: {
      x: number; y: number; r: number; vx: number; vy: number; alpha: number; hue: number;
    }[] = [];
    const mouse = { x: 0, y: 0 };
    const bulbPos = { x: 0, y: 0 };
    let raf = 0;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      if (!bulbPos.x) { bulbPos.x = canvas!.width / 2; bulbPos.y = canvas!.height / 2; }
    }

    function createBulbs(n: number) {
      bulbs = [];
      for (let i = 0; i < n; i++) bulbs.push({
        x: Math.random() * canvas!.width, y: Math.random() * canvas!.height,
        r: 80 + Math.random() * 180, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
        alpha: 0.25 + Math.random() * 0.4, hue: Math.random() < 0.5 ? 0 : 10,
      });
    }

    function onMove(e: MouseEvent) { mouse.x = e.clientX; mouse.y = e.clientY; }

    function draw() {
      const c = ctx!;
      c.clearRect(0, 0, canvas!.width, canvas!.height);
      bulbPos.x += (mouse.x - bulbPos.x) * 0.04;
      bulbPos.y += (mouse.y - bulbPos.y) * 0.04;
      const mg = c.createRadialGradient(bulbPos.x, bulbPos.y, 0, bulbPos.x, bulbPos.y, 220);
      mg.addColorStop(0, "hsla(0,100%,80%,0.45)");
      mg.addColorStop(1, "hsla(0,100%,60%,0)");
      c.beginPath(); c.arc(bulbPos.x, bulbPos.y, 220, 0, Math.PI * 2);
      c.fillStyle = mg; c.fill();
      bulbs.forEach((b) => {
        const g = c.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, `hsla(${b.hue},100%,70%,${b.alpha})`);
        g.addColorStop(1, `hsla(${b.hue},100%,40%,0)`);
        c.beginPath(); c.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        c.fillStyle = g; c.fill();
        b.x += b.vx; b.y += b.vy;
        if (b.x < -b.r) b.x = canvas!.width + b.r;
        if (b.x > canvas!.width + b.r) b.x = -b.r;
        if (b.y < -b.r) b.y = canvas!.height + b.r;
        if (b.y > canvas!.height + b.r) b.y = -b.r;
      });
      raf = requestAnimationFrame(draw);
    }

    function onResize() { resize(); createBulbs(18); }

    resize(); createBulbs(18); draw();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas id="bulbs-canvas" ref={ref} />;
}
