/**
 * ParticleLayer — a canvas overlay inside the map that renders:
 * - explosion bursts (war declarations, battles, god interventions)
 * - animated arcs between continents: gold = trade, blue = alliance, red = war
 * - weather: snowfall over Antarctica, rising embers over war zones
 *
 * All coordinates are fractions (0..1) of the map container.
 */
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export interface ParticleHandle {
  burst: (x: number, y: number, color: string, big?: boolean) => void;
}

export interface ArcLink {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  color: string;
}

interface Props {
  links: ArcLink[];
  snowAt: { x: number; y: number } | null;
  embers: { x: number; y: number }[];
}

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  grav: number;
  sway: number;
  phase: number;
}

const MAX_P = 500;

const ParticleLayer = forwardRef<ParticleHandle, Props>(function ParticleLayer(
  { links, snowAt, embers },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const parts = useRef<P[]>([]);
  const linksRef = useRef(links);
  const snowRef = useRef(snowAt);
  const embersRef = useRef(embers);
  linksRef.current = links;
  snowRef.current = snowAt;
  embersRef.current = embers;

  useImperativeHandle(ref, () => ({
    burst(x, y, color, big = false) {
      const n = big ? 70 : 30;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = (big ? 0.35 : 0.22) * (0.4 + Math.random() * 0.8);
        parts.current.push({
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 0.05,
          life: 0,
          max: 50 + Math.random() * 40,
          size: 2 + Math.random() * (big ? 5 : 3.5),
          color,
          grav: 0.004,
          sway: 0,
          phase: Math.random() * 6,
        });
      }
      if (parts.current.length > MAX_P) {
        parts.current.splice(0, parts.current.length - MAX_P);
      }
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const g = canvas.getContext('2d');
    if (!g) return;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.floor(r.width * dpr));
      canvas.height = Math.max(1, Math.floor(r.height * dpr));
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    let raf = 0;
    let frame = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      frame++;
      const W = canvas.width;
      const H = canvas.height;
      if (W < 2 || H < 2) return;
      g.clearRect(0, 0, W, H);

      // ambient weather
      const snow = snowRef.current;
      if (snow && frame % 2 === 0) {
        for (let i = 0; i < 2; i++) {
          parts.current.push({
            x: snow.x + (Math.random() - 0.5) * 0.16,
            y: snow.y - 0.06 - Math.random() * 0.04,
            vx: 0,
            vy: 0.0011 + Math.random() * 0.0009,
            life: 0,
            max: 260,
            size: 1.4 + Math.random() * 1.8,
            color: '#e0f2fe',
            grav: 0,
            sway: 0.0012,
            phase: Math.random() * 6,
          });
        }
      }
      for (const e of embersRef.current) {
        if (frame % 3 === 0) {
          parts.current.push({
            x: e.x + (Math.random() - 0.5) * 0.05,
            y: e.y + (Math.random() - 0.5) * 0.03,
            vx: (Math.random() - 0.5) * 0.002,
            vy: -0.0022 - Math.random() * 0.002,
            life: 0,
            max: 90 + Math.random() * 50,
            size: 1.6 + Math.random() * 2.4,
            color: Math.random() < 0.5 ? '#fb923c' : '#ef4444',
            grav: -0.00004,
            sway: 0.001,
            phase: Math.random() * 6,
          });
        }
      }
      if (parts.current.length > MAX_P) parts.current.splice(0, parts.current.length - MAX_P);

      // arcs between continents
      const t = performance.now() / 2600;
      for (const L of linksRef.current) {
        const dx = L.bx - L.ax;
        const dy = L.by - L.ay;
        const len = Math.hypot(dx, dy) || 1;
        const cx = (L.ax + L.bx) / 2 - (dy / len) * 0.1;
        const cy = (L.ay + L.by) / 2 + (dx / len) * 0.1;
        g.strokeStyle = L.color;
        g.globalAlpha = 0.32;
        g.lineWidth = Math.max(1.5, W / 400);
        g.beginPath();
        g.moveTo(L.ax * W, L.ay * H);
        g.quadraticCurveTo(cx * W, cy * H, L.bx * W, L.by * H);
        g.stroke();
        g.globalAlpha = 1;
        // travelling sparks
        for (let i = 0; i < 3; i++) {
          const k = (t + i / 3 + (L.ax * 7 + L.ay * 13)) % 1;
          const kk = k < 0 ? k + 1 : k;
          const ix = (1 - kk) * (1 - kk) * L.ax + 2 * (1 - kk) * kk * cx + kk * kk * L.bx;
          const iy = (1 - kk) * (1 - kk) * L.ay + 2 * (1 - kk) * kk * cy + kk * kk * L.by;
          const r = (2.2 + 1.6 * Math.sin(kk * Math.PI)) * (W / 500);
          const grad = g.createRadialGradient(ix * W, iy * H, 0, ix * W, iy * H, r * 3);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.35, L.color);
          grad.addColorStop(1, 'transparent');
          g.fillStyle = grad;
          g.beginPath();
          g.arc(ix * W, iy * H, r * 3, 0, Math.PI * 2);
          g.fill();
        }
      }

      // particles
      const arr = parts.current;
      for (let i = arr.length - 1; i >= 0; i--) {
        const p = arr[i];
        p.life++;
        if (p.life >= p.max) {
          arr.splice(i, 1);
          continue;
        }
        p.vy += p.grav;
        p.x += p.vx + Math.sin(frame / 22 + p.phase) * p.sway;
        p.y += p.vy;
        const fade = 1 - p.life / p.max;
        const r = p.size * (W / 700);
        g.globalAlpha = Math.min(1, fade * 1.4);
        g.fillStyle = p.color;
        g.beginPath();
        g.arc(p.x * W, p.y * H, Math.max(0.6, r * fade + 0.4), 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ zIndex: 5 }}
    />
  );
});

export default ParticleLayer;
