/**
 * BreakingNews — full-screen cinematic cutscene for major world events.
 * The simulation pauses while it plays; each item auto-advances with a
 * dramatic portrait reveal, then the sim resumes.
 */
import { useEffect, useState } from 'react';
import type { CinematicEvent } from '../engine/types';
import { CHARACTERS, type Lang, type Strings } from '../i18n';
import { PORTRAITS } from '../portraits';
import { playSfx } from '../audio';

interface Props {
  events: CinematicEvent[];
  lang: Lang;
  t: Strings;
  onDone: () => void;
}

const KIND_UI: Record<string, { badge: string; gradient: string; glow: string }> = {
  war: {
    badge: '🚨',
    gradient: 'linear-gradient(135deg, #7f1d1d 0%, #1a0505 70%)',
    glow: '#ef4444',
  },
  peace: {
    badge: '🕊️',
    gradient: 'linear-gradient(135deg, #064e3b 0%, #04120d 70%)',
    glow: '#10b981',
  },
  organization: {
    badge: '🏛️',
    gradient: 'linear-gradient(135deg, #134e4a 0%, #0b1026 70%)',
    glow: '#14b8a6',
  },
  god: {
    badge: '⚡',
    gradient: 'linear-gradient(135deg, #4c1d95 0%, #0b1026 70%)',
    glow: '#8b5cf6',
  },
};

const DURATION = 5200;

export default function BreakingNews({ events, lang, t, onDone }: Props) {
  const [idx, setIdx] = useState(0);
  const ev = events[idx];
  const ui = KIND_UI[ev?.kind] ?? KIND_UI.god;

  useEffect(() => {
    if (!ev) return;
    if (ev.kind === 'war') {
      playSfx('horn');
      setTimeout(() => playSfx('thunder'), 350);
    } else if (ev.kind === 'peace') {
      playSfx('chime');
    } else {
      playSfx('coin');
    }
  }, [ev]);

  useEffect(() => {
    if (idx >= events.length) {
      onDone();
      return;
    }
    const timer = setTimeout(() => setIdx((i) => i + 1), DURATION);
    return () => clearTimeout(timer);
  }, [idx, events.length, onDone]);

  if (!ev) return null;
  const chA = CHARACTERS[ev.a];
  const chB = ev.b ? CHARACTERS[ev.b] : null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={() => setIdx((i) => i + 1)}
    >
      <div
        key={ev.id}
        className="news-card w-full max-w-md overflow-hidden rounded-3xl border border-white/15 shadow-2xl"
        style={{ background: ui.gradient }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* banner */}
        <div className="relative flex items-center justify-center gap-3 px-5 pb-2 pt-6">
          <div
            className="pointer-events-none absolute inset-0"
            style={{ boxShadow: `inset 0 0 90px ${ui.glow}55` }}
          />
          <img
            src={PORTRAITS[ev.a]}
            alt={chA[lang].name}
            className="news-portrait h-24 w-24 rounded-full border-4 object-cover"
            style={{ borderColor: ui.glow, boxShadow: `0 0 34px ${ui.glow}` }}
          />
          {chB && (
            <img
              src={PORTRAITS[ev.b!]}
              alt={chB[lang].name}
              className="news-portrait -ms-8 h-16 w-16 rounded-full border-4 border-black/60 object-cover"
              style={{ boxShadow: `0 0 22px ${ui.glow}` }}
            />
          )}
          <span className="absolute start-4 top-4 rounded-full bg-black/60 px-3 py-1 text-[12px] font-extrabold text-white">
            {ui.badge} {t['news.breaking']}
          </span>
        </div>

        {/* body */}
        <div className="px-5 pb-5 pt-1 text-center">
          <h2 className="text-[24px] font-extrabold leading-tight text-white">{ev.title}</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-white/90">{ev.text}</p>

          {/* progress */}
          <div className="mt-4 flex justify-center gap-1.5">
            {events.map((e, i) => (
              <span
                key={e.id}
                className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-8 bg-white' : i < idx ? 'w-3 bg-white/60' : 'w-3 bg-white/25'}`}
              />
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setIdx((i) => i + 1)}
              className="flex-1 rounded-xl bg-white/15 py-2.5 text-[14px] font-bold text-white transition active:scale-[0.98]"
            >
              {t['news.next']}
            </button>
            <button
              onClick={onDone}
              className="rounded-xl bg-white/10 px-4 py-2.5 text-[14px] font-bold text-white/70 transition active:scale-[0.98]"
            >
              ✕
            </button>
          </div>
        </div>

        {/* auto-advance bar */}
        <div className="h-1 w-full bg-white/10">
          <div key={ev.id} className="news-progress h-full bg-white/80" style={{ animationDuration: `${DURATION}ms` }} />
        </div>
      </div>
    </div>
  );
}
