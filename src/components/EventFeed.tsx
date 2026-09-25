/**
 * Event feed — world events rendered as comic dialogue bubbles:
 * each entry carries the speaker's painted portrait, like subtitles
 * in a movie. Major events get a dramatic card.
 */
import { useState } from 'react';
import type { ContinentId, FeedEvent, FeedKind } from '../engine/types';
import { CHARACTERS, cname, fmt, type Lang, type Strings } from '../i18n';
import { PORTRAITS } from '../portraits';

const KIND_STYLE: Record<FeedKind, string> = {
  war: 'border-red-500/50 bg-red-950/70',
  peace: 'border-emerald-500/50 bg-emerald-950/70',
  alliance: 'border-blue-500/50 bg-blue-950/70',
  trade: 'border-amber-500/50 bg-amber-950/60',
  tech: 'border-cyan-500/50 bg-cyan-950/70',
  treaty: 'border-violet-500/50 bg-violet-950/70',
  government: 'border-orange-500/50 bg-orange-950/60',
  organization: 'border-teal-500/50 bg-teal-950/70',
  event: 'border-pink-500/50 bg-pink-950/60',
  info: 'border-white/15 bg-[#0d1330]/90',
};

function Speakers({ ids, lang }: { ids: ContinentId[]; lang: Lang }) {
  if (ids.length === 0) {
    return (
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-white/20 bg-black/60 text-2xl">
        🌍
      </span>
    );
  }
  const shown = ids.slice(0, 2);
  return (
    <span className="flex shrink-0">
      {shown.map((id, i) => (
        <img
          key={id}
          src={PORTRAITS[id]}
          alt={cname(id, lang)}
          title={cname(id, lang)}
          className={`h-12 w-12 rounded-full border-2 object-cover ${i > 0 ? '-ms-4' : ''}`}
          style={{ borderColor: CHARACTERS[id].color }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ))}
    </span>
  );
}

export default function EventFeed({ feed, lang, t }: { feed: FeedEvent[]; lang: Lang; t: Strings }) {
  const [majorOnly, setMajorOnly] = useState(false);
  const items = majorOnly ? feed.filter((e) => e.major) : feed;

  return (
    <div className="glass rounded-2xl p-3">
      <div className="mb-2.5 flex items-center justify-between px-1">
        <h2 className="text-[15px] font-bold tracking-wide text-white">{t['feed.title']}</h2>
        <button
          onClick={() => setMajorOnly((v) => !v)}
          className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold transition active:scale-95 ${
            majorOnly ? 'bg-amber-400/90 text-black' : 'bg-white/10 text-white/75'
          }`}
        >
          {t['feed.major']}
        </button>
      </div>
      <div className="slim-scroll max-h-[60vh] space-y-2.5 overflow-y-auto pe-1">
        {items.length === 0 && <p className="p-4 text-center text-[14px] text-white/50">{t['feed.empty']}</p>}
        {items.map((e) => (
          <div
            key={e.id}
            className={`bubble-in flex gap-2.5 rounded-2xl border p-3 ${KIND_STYLE[e.kind]} ${e.major ? 'shadow-lg' : ''}`}
          >
            <Speakers ids={e.continents} lang={lang} />
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate text-[12px] font-bold text-white/85">
                  {e.continents.length > 0
                    ? e.continents
                        .slice(0, 2)
                        .map((id) => cname(id, lang))
                        .join(' × ')
                    : t['feed.title'].replace('📡 ', '')}
                </span>
                <span className="flex shrink-0 items-center gap-1 text-[11px] text-white/60">
                  {e.major && <span>⭐</span>}
                  {fmt(e.year, lang)} · {t['ctrl.turn']} {fmt(e.turn, lang)}
                </span>
              </div>
              <p className={`leading-relaxed text-white ${e.major ? 'text-[15.5px] font-medium' : 'text-[14.5px]'}`}>
                {e.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
