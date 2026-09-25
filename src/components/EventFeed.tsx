/**
 * Real-time event feed — every agent action, battle and world event,
 * newest first. Major events are highlighted.
 */
import { useState } from 'react';
import type { FeedEvent, FeedKind } from '../engine/types';
import { fmt, type Lang, type Strings } from '../i18n';

const KIND_STYLE: Record<FeedKind, string> = {
  war: 'border-red-500/40 bg-red-500/10',
  peace: 'border-emerald-500/40 bg-emerald-500/10',
  alliance: 'border-blue-500/40 bg-blue-500/10',
  trade: 'border-amber-500/40 bg-amber-500/10',
  tech: 'border-cyan-500/40 bg-cyan-500/10',
  treaty: 'border-violet-500/40 bg-violet-500/10',
  government: 'border-orange-500/40 bg-orange-500/10',
  organization: 'border-teal-500/40 bg-teal-500/10',
  event: 'border-pink-500/40 bg-pink-500/10',
  info: 'border-white/10 bg-white/5',
};

export default function EventFeed({ feed, lang, t }: { feed: FeedEvent[]; lang: Lang; t: Strings }) {
  const [majorOnly, setMajorOnly] = useState(false);
  const items = majorOnly ? feed.filter((e) => e.major) : feed;

  return (
    <div className="glass rounded-2xl p-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-sm font-bold tracking-wide text-white/90">{t['feed.title']}</h2>
        <button
          onClick={() => setMajorOnly((v) => !v)}
          className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
            majorOnly ? 'bg-amber-400/90 text-black' : 'bg-white/10 text-white/70'
          }`}
        >
          {t['feed.major']}
        </button>
      </div>
      <div className="slim-scroll max-h-[55vh] space-y-2 overflow-y-auto pr-1">
        {items.length === 0 && <p className="p-4 text-center text-sm text-white/40">{t['feed.empty']}</p>}
        {items.map((e) => (
          <div
            key={e.id}
            className={`feed-item rounded-xl border p-2.5 text-[13px] leading-snug ${KIND_STYLE[e.kind]}`}
          >
            <div className="mb-0.5 flex items-center justify-between">
              <span className="font-mono text-[10px] text-white/45">
                {fmt(e.year, lang)} · T{fmt(e.turn, lang)}
              </span>
              {e.major && <span className="text-[10px]">⭐</span>}
            </div>
            <p className="text-white/90">{e.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
