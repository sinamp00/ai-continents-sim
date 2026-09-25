/**
 * ZoomMap — the cinematic world map.
 *
 * A real dark dotted world map you can pan and zoom like a strategy game
 * (think Crusader Kings): scroll / pinch to zoom, drag to pan, double-tap
 * a character to dive in. Zooming in reveals more of each character's life
 * (mood, then their current activity); tapping a character opens their full
 * cinematic scene — portrait, what they're doing, and their inner voice
 * with a typewriter effect. Includes a 🎬 Cinema mode that auto-tours all
 * seven characters like scenes in a movie.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Continent, ContinentId } from '../engine/types';
import { CONTINENT_IDS, powerScore } from '../engine/types';
import { CHARACTERS, fmt, moodEmoji, moodName, type Lang, type Strings } from '../i18n';

interface Props {
  continents: Record<ContinentId, Continent>;
  selected: ContinentId | null;
  onSelect: (id: ContinentId) => void;
  lang: Lang;
  t: Strings;
  /** increments every simulated turn — restarts the thought typewriter */
  turn: number;
}

interface View {
  s: number;
  x: number;
  y: number;
}

const MIN_S = 1;
const MAX_S = 4;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Inner-voice line with a typewriter reveal. */
function Typewriter({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
  }, [text]);
  useEffect(() => {
    if (n >= text.length) return;
    const t = setTimeout(() => setN((v) => Math.min(text.length, v + 3)), 28);
    return () => clearTimeout(t);
  }, [n, text]);
  return (
    <span>
      {text.slice(0, n)}
      {n < text.length && <span className="tw-caret">▍</span>}
    </span>
  );
}

/** Full cinematic scene card for one character (bottom sheet over the map). */
function SceneCard({
  id,
  continent,
  lang,
  t,
  turn,
  onClose,
}: {
  id: ContinentId;
  continent: Continent;
  lang: Lang;
  t: Strings;
  turn: number;
  onClose: () => void;
}) {
  const ch = CHARACTERS[id];
  const atWar = continent.atWarWith.length > 0;
  const score = Math.round(powerScore(continent));
  return (
    <div
      data-nopan
      className="scene-sheet absolute inset-x-2 bottom-2 z-30 overflow-hidden rounded-2xl border border-white/15 bg-[#0b1026]/95 shadow-2xl backdrop-blur-xl"
    >
      {atWar && <div className="vignette-war pointer-events-none absolute inset-0 z-10" />}
      <div className="relative z-20 p-3">
        <div className="flex items-start gap-3">
          <span
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-4xl"
            style={{
              background: 'rgba(8,12,28,.9)',
              border: `3px solid ${atWar ? '#ef4444' : ch.color}`,
              boxShadow: `0 0 22px ${atWar ? '#ef4444' : ch.color}`,
            }}
          >
            {ch.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate text-base font-extrabold text-white">{ch[lang].name}</h3>
              <button
                onClick={onClose}
                className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white/70 active:scale-95"
              >
                {t['scene.close']}
              </button>
            </div>
            <p className="text-[12px] font-semibold" style={{ color: ch.color }}>
              {ch[lang].title}
            </p>
            <p className="mt-0.5 text-[12px] text-white/80">
              {moodEmoji(continent.mood)} {moodName(continent.mood, lang)}
              <span className="text-white/40"> · ⚡{fmt(score, lang)}</span>
            </p>
          </div>
        </div>

        <p className="mt-2.5 rounded-xl bg-white/5 px-2.5 py-2 text-[12.5px] leading-snug text-white/90">
          <span className="font-bold text-amber-200">{t['scene.doing']}: </span>
          {continent.activity}
        </p>
        <div className="mt-2 rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-2.5 py-2">
          <p className="mb-1 text-[10.5px] font-bold uppercase tracking-wider text-cyan-200/70">
            {t['scene.thinking']}
          </p>
          <p className="min-h-[2.6em] text-[13px] italic leading-snug text-cyan-50">
            <Typewriter key={`${id}-${turn}`} text={`«${continent.thought}»`} />
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ZoomMap({ continents, selected, onSelect, lang, t, turn }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({ s: 1, x: 0, y: 0 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const [focused, setFocused] = useState<ContinentId | null>(null);
  const [cinema, setCinema] = useState(false);
  const [cinemaIdx, setCinemaIdx] = useState(0);
  const cinemaOrder = useRef<ContinentId[]>([]);
  const animRef = useRef<number>(0);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ d: number; mx: number; my: number; view: View } | null>(null);
  const dragStart = useRef<{ x: number; y: number; view: View; moved: boolean } | null>(null);
  const lastTap = useRef<{ t: number; x: number; y: number }>({ t: 0, x: 0, y: 0 });

  const scores = CONTINENT_IDS.map((id) => powerScore(continents[id]));
  const max = Math.max(...scores, 1);

  const clampView = useCallback((v: View): View => {
    const el = viewportRef.current;
    if (!el) return v;
    const W = el.clientWidth;
    const H = el.clientHeight;
    const s = clamp(v.s, MIN_S, MAX_S);
    return {
      s,
      x: clamp(v.x, W - s * W, 0),
      y: clamp(v.y, H - s * H, 0),
    };
  }, []);

  const applyView = useCallback(
    (v: View) => {
      const c = clampView(v);
      viewRef.current = c;
      setView(c);
    },
    [clampView],
  );

  /** Smooth cinematic camera flight to a map point (percent coords). */
  const flyTo = useCallback(
    (s: number, mxPct: number, myPct: number, dur = 950) => {
      const el = viewportRef.current;
      if (!el) return;
      const W = el.clientWidth;
      const H = el.clientHeight;
      const target = clampView({
        s,
        x: W / 2 - s * ((mxPct / 100) * W),
        y: H / 2 - s * ((myPct / 100) * H),
      });
      cancelAnimationFrame(animRef.current);
      const from = { ...viewRef.current };
      const t0 = performance.now();
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - k, 3);
        applyView({ s: lerp(from.s, target.s, e), x: lerp(from.x, target.x, e), y: lerp(from.y, target.y, e) });
        if (k < 1) animRef.current = requestAnimationFrame(step);
      };
      animRef.current = requestAnimationFrame(step);
    },
    [applyView, clampView],
  );

  const stopCinema = useCallback(() => {
    setCinema(false);
    cancelAnimationFrame(animRef.current);
  }, []);

  const openScene = useCallback(
    (id: ContinentId) => {
      onSelect(id);
      setFocused(id);
    },
    [onSelect],
  );

  const diveToCharacter = useCallback(
    (id: ContinentId) => {
      const ch = CHARACTERS[id];
      flyTo(2.8, ch.mapX, ch.mapY);
      openScene(id);
    },
    [flyTo, openScene],
  );

  /* ---------------- cinema mode: auto-tour like movie scenes ---------------- */
  useEffect(() => {
    if (!cinema) return;
    const id = cinemaOrder.current[cinemaIdx % cinemaOrder.current.length];
    if (id) {
      const ch = CHARACTERS[id];
      flyTo(2.7, ch.mapX, ch.mapY, 1100);
      openScene(id);
    }
    const timer = setTimeout(() => setCinemaIdx((i) => i + 1), 5200);
    return () => clearTimeout(timer);
  }, [cinema, cinemaIdx, flyTo, openScene]);

  const startCinema = useCallback(() => {
    cinemaOrder.current = [...CONTINENT_IDS].sort((a, b) => powerScore(continents[b]) - powerScore(continents[a]));
    setCinemaIdx(0);
    setCinema(true);
  }, [continents]);

  /* ---------------- pointer: drag pan, pinch zoom, double-tap ---------------- */
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      stopCinema();
      cancelAnimationFrame(animRef.current);
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const v = viewRef.current;
      const ns = clamp(v.s * (e.deltaY < 0 ? 1.18 : 1 / 1.18), MIN_S, MAX_S);
      // keep the content point under the cursor fixed
      const cx = (px - v.x) / v.s;
      const cy = (py - v.y) / v.s;
      applyView({ s: ns, x: px - ns * cx, y: py - ns * cy });
    };

    const onPointerDown = (e: PointerEvent) => {
      // markers & scene card handle their own gestures
      if ((e.target as Element).closest('[data-nopan]')) return;
      (e.target as Element).setPointerCapture?.(e.pointerId);
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.current.size === 2) {
        const [p1, p2] = [...pointers.current.values()];
        pinchStart.current = {
          d: Math.hypot(p1.x - p2.x, p1.y - p2.y),
          mx: (p1.x + p2.x) / 2,
          my: (p1.y + p2.y) / 2,
          view: { ...viewRef.current },
        };
        dragStart.current = null;
        stopCinema();
        cancelAnimationFrame(animRef.current);
      } else if (pointers.current.size === 1) {
        dragStart.current = { x: e.clientX, y: e.clientY, view: { ...viewRef.current }, moved: false };
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!pointers.current.has(e.pointerId)) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinchStart.current && pointers.current.size === 2) {
        const [p1, p2] = [...pointers.current.values()];
        const rect = el.getBoundingClientRect();
        const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        const mx = (p1.x + p2.x) / 2 - rect.left;
        const my = (p1.y + p2.y) / 2 - rect.top;
        const st = pinchStart.current;
        if (st.d > 0) {
          const ns = clamp(st.view.s * (d / st.d), MIN_S, MAX_S);
          const cx = (mx - st.view.x) / st.view.s;
          const cy = (my - st.view.y) / st.view.s;
          applyView({ s: ns, x: mx - ns * cx, y: my - ns * cy });
        }
        return;
      }
      const ds = dragStart.current;
      if (ds && pointers.current.size === 1) {
        const dx = e.clientX - ds.x;
        const dy = e.clientY - ds.y;
        if (Math.abs(dx) + Math.abs(dy) > 10) {
          if (!ds.moved) {
            ds.moved = true;
            stopCinema();
            cancelAnimationFrame(animRef.current);
          }
          applyView({ s: ds.view.s, x: ds.view.x + dx, y: ds.view.y + dy });
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const wasTap = dragStart.current && !dragStart.current.moved;
      const upX = e.clientX;
      const upY = e.clientY;
      pointers.current.delete(e.pointerId);
      if (pointers.current.size < 2) pinchStart.current = null;
      if (pointers.current.size === 0) {
        // background double-tap toggles zoom at the tap point
        if (wasTap) {
          const now = performance.now();
          const rect = el.getBoundingClientRect();
          const px = upX - rect.left;
          const py = upY - rect.top;
          if (now - lastTap.current.t < 320 && Math.hypot(px - lastTap.current.x, py - lastTap.current.y) < 40) {
            const v = viewRef.current;
            if (v.s < 1.6) {
              const ns = 2.4;
              const cx = (px - v.x) / v.s;
              const cy = (py - v.y) / v.s;
              flyTo(ns, (cx / rect.width) * 100, (cy / rect.height) * 100, 500);
            } else {
              flyTo(1, 50, 50, 500);
            }
            lastTap.current = { t: 0, x: 0, y: 0 };
          } else {
            lastTap.current = { t: now, x: px, y: py };
          }
        }
        dragStart.current = null;
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
    };
  }, [applyView, flyTo, stopCinema]);

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  const s = view.s;
  const showMood = s >= 1.6;
  const showActivity = s >= 2.4;
  const cinemaId = cinema ? cinemaOrder.current[cinemaIdx % cinemaOrder.current.length] : null;

  return (
    <div className="glass rounded-2xl p-3">
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <h2 className="text-sm font-bold tracking-wide text-white/90">{t['map.title']}</h2>
        <div className="flex items-center gap-1.5">
          {s > 1.05 && (
            <button
              onClick={() => flyTo(1, 50, 50, 500)}
              className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/70 active:scale-95"
            >
              {t['map.reset']}
            </button>
          )}
          <button
            onClick={() => (cinema ? stopCinema() : startCinema())}
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold active:scale-95 ${
              cinema ? 'bg-red-500/30 text-red-200' : 'bg-amber-500/25 text-amber-200'
            }`}
          >
            {cinema ? t['cinema.stop'] : t['cinema.play']}
          </button>
        </div>
      </div>

      {/* viewport */}
      <div
        ref={viewportRef}
        dir="ltr"
        className="relative aspect-[2/1] w-full select-none overflow-hidden rounded-xl bg-[#05070f]"
        style={{ touchAction: 'none', cursor: dragStart.current?.moved ? 'grabbing' : 'grab' }}
      >
        <div
          className="absolute left-0 top-0 h-full w-full"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})`, transformOrigin: '0 0' }}
        >
          <img
            src={`${import.meta.env.BASE_URL}world-map.webp`}
            alt=""
            className="absolute inset-0 h-full w-full"
            draggable={false}
          />
          {CONTINENT_IDS.map((id, i) => {
            const c = continents[id];
            const ch = CHARACTERS[id];
            const score = scores[i];
            const strength = score / max;
            const isSelected = selected === id;
            const atWar = c.atWarWith.length > 0;
            const size = (30 + strength * 10) / Math.sqrt(s);
            return (
              <button
                key={id}
                data-nopan
                onClick={() => openScene(id)}
                onDoubleClick={() => diveToCharacter(id)}
                className="absolute flex flex-col items-center"
                style={{ left: `${ch.mapX}%`, top: `${ch.mapY}%`, transform: 'translate(-50%, -50%)' }}
                aria-label={ch[lang].name}
              >
                <span
                  className={`flex items-center justify-center rounded-full transition-transform ${
                    atWar ? 'war-pulse' : ''
                  } ${isSelected ? 'scale-125' : ''}`}
                  style={{
                    width: size,
                    height: size,
                    fontSize: size * 0.52,
                    background: 'rgba(8,12,28,.85)',
                    border: `2px solid ${atWar ? '#ef4444' : isSelected ? '#fff' : ch.color}`,
                    boxShadow: `0 0 ${8 + strength * 14}px ${atWar ? '#ef4444' : ch.color}`,
                  }}
                >
                  {ch.emoji}
                </span>
                <span
                  className="mt-0.5 max-w-[76px] truncate whitespace-nowrap rounded-full bg-black/75 px-1.5 py-px font-bold text-white"
                  style={{ fontSize: Math.max(2.5, 9 / s), textShadow: '0 1px 3px #000' }}
                >
                  {showMood && `${moodEmoji(c.mood)} `}
                  {ch[lang].name} · {fmt(Math.round(score), lang)}
                </span>
                {showActivity && (
                  <span
                    className="mt-0.5 max-w-[110px] truncate rounded-full bg-cyan-950/80 px-1.5 py-px text-cyan-100"
                    style={{ fontSize: Math.max(2.2, 8.5 / s) }}
                  >
                    {c.activity}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* cinema caption */}
        {cinema && cinemaId && (
          <div className="cinema-caption absolute inset-x-0 top-0 z-20 flex items-center justify-center gap-2 bg-gradient-to-b from-black/80 to-transparent px-3 pb-6 pt-2.5">
            <span className="text-[12px] font-bold text-amber-200">
              🎬 {t['cinema.sceneOf']} {fmt((cinemaIdx % cinemaOrder.current.length) + 1, lang)} {t['cinema.of']}{' '}
              {fmt(cinemaOrder.current.length, lang)} — {CHARACTERS[cinemaId][lang].name}
            </span>
            <span className="flex gap-1">
              {cinemaOrder.current.map((cid, i) => (
                <span
                  key={cid}
                  className={`h-1.5 w-1.5 rounded-full ${i === cinemaIdx % cinemaOrder.current.length ? 'bg-amber-300' : 'bg-white/30'}`}
                />
              ))}
            </span>
          </div>
        )}

        {/* character scene */}
        {focused && !cinema && (
          <SceneCard id={focused} continent={continents[focused]} lang={lang} t={t} turn={turn} onClose={() => setFocused(null)} />
        )}
        {cinema && cinemaId && (
          <SceneCard
            id={cinemaId}
            continent={continents[cinemaId]}
            lang={lang}
            t={t}
            turn={turn}
            onClose={stopCinema}
          />
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 px-1">
        <span className="text-[11px] text-white/60">{t['map.zoomHint']}</span>
      </div>
      <div className="mt-1 flex flex-wrap gap-2 px-1">
        <span className="text-[11px] text-white/60">{t['map.legendWar']}</span>
        <span className="text-[11px] text-white/60">{t['map.legendPower']}</span>
      </div>
    </div>
  );
}
