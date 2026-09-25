/**
 * Historical timeline — major events in chronological order.
 */
import type { TimelineEntry } from '../engine/types';
import { fmt, type Lang, type Strings } from '../i18n';

export default function Timeline({ entries, lang, t }: { entries: TimelineEntry[]; lang: Lang; t: Strings }) {
  const items = [...entries].sort((a, b) => b.turn - a.turn);
  return (
    <div className="glass rounded-2xl p-3">
      <h2 className="mb-3 px-1 text-sm font-bold tracking-wide text-white/90">{t['time.title']}</h2>
      <div className="slim-scroll max-h-[55vh] space-y-0 overflow-y-auto pr-1">
        {items.map((item, i) => (
          <div key={item.id} className="relative flex gap-3 pb-4">
            {/* rail */}
            <div className="flex flex-col items-center">
              <div className="h-3 w-3 shrink-0 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,.8)]" />
              {i < items.length - 1 && <div className="w-px flex-1 bg-white/15" />}
            </div>
            <div className="flex-1 rounded-xl bg-white/5 p-2.5">
              <div className="mb-0.5 flex items-center justify-between">
                <span className="text-[13px] font-bold text-white">{item.title}</span>
                <span className="font-mono text-[10px] text-white/60">{fmt(item.year, lang)}</span>
              </div>
              <p className="text-[12px] leading-snug text-white/70">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
