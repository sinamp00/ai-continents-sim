/**
 * Timelapse — replay the whole history of the world as a racing bar chart:
 * every turn's power per civilization, plus war markers.
 */
import { useEffect, useRef, useState } from 'react';
import type { ContinentId, HistorySnapshot } from '../engine/types';
import { CONTINENT_IDS } from '../engine/types';
import { CHARACTERS, cname, fmt, type Lang, type Strings } from '../i18n';
import { PORTRAITS } from '../portraits';

interface Props {
  history: HistorySnapshot[];
  lang: Lang;
  t: Strings;
  onClose: () => void;
}

export default function Timelapse({ history, lang, t, onClose }: Props) {
  const [idx, setIdx] = useState(history.length - 1);
  const [playing, setPlaying] = useState(true);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setIdx(history.length - 1);
  }, [history.length]);

  useEffect(() => {
    if (!playing || history.length < 2) return;
    timer.current = window.setInterval(() => {
      setIdx((i) => (i + 1 >= history.length ? 0 : i + 1));
    }, 750);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [playing, history.length]);

  const snap = history[idx];
  const order: ContinentId[] = snap
    ? [...CONTINENT_IDS].sort((a, b) => snap.powers[b] - snap.powers[a])
    : [];
  const max = snap ? Math.max(...CONTINENT_IDS.map((id) => snap.powers[id]), 1) : 1;
  const atWar = new Set<ContinentId>();
  snap?.wars.forEach(([a, b]) => {
    atWar.add(a);
    atWar.add(b);
  });

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="news-card w-full max-w-md rounded-3xl border border-white/15 bg-[#0b1026]/95 p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[19px] font-extrabold text-white">{t['timelapse.title']}</h2>
          <button onClick={onClose} className="rounded-full bg-white/10 px-3 py-1 text-[13px] font-bold text-white/70">
            ✕
          </button>
        </div>

        {snap ? (
          <>
            <p className="mb-3 text-center font-mono text-3xl font-extrabold text-amber-200">
              {fmt(snap.year, lang)}
              <span className="ms-2 align-middle text-[13px] font-bold text-white/60">
                {t['ctrl.turn']} {fmt(snap.turn, lang)}
              </span>
            </p>
            <div className="space-y-2">
              {order.map((id) => {
                const w = Math.max(4, (snap.powers[id] / max) * 100);
                return (
                  <div key={id} className="flex items-center gap-2">
                    <img
                      src={PORTRAITS[id]}
                      alt={cname(id, lang)}
                      className={`h-9 w-9 shrink-0 rounded-full border-2 object-cover ${atWar.has(id) ? 'border-red-500' : 'border-white/20'}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-center justify-between text-[12px]">
                        <span className="truncate font-bold text-white/90">
                          {atWar.has(id) && '⚔️ '}
                          {cname(id, lang)}
                        </span>
                        <span className="font-mono text-white/70">{fmt(snap.powers[id], lang)}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${w}%`,
                            background: `linear-gradient(90deg, ${CHARACTERS[id].color}88, ${CHARACTERS[id].color})`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <input
              type="range"
              min={0}
              max={history.length - 1}
              value={idx}
              onChange={(e) => {
                setPlaying(false);
                setIdx(Number(e.target.value));
              }}
              className="mt-4 w-full accent-amber-300"
              dir="ltr"
            />
            <button
              onClick={() => setPlaying((p) => !p)}
              className="mt-2 w-full rounded-2xl bg-amber-500/80 py-2.5 text-[15px] font-extrabold text-black transition active:scale-[0.98]"
            >
              {playing ? t['timelapse.pause'] : t['timelapse.play']}
            </button>
          </>
        ) : (
          <p className="py-8 text-center text-[15px] text-white/60">{t['timelapse.empty']}</p>
        )}
      </div>
    </div>
  );
}
