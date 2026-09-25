/**
 * Historical timeline — major events in chronological order.
 */
import type { TimelineEntry } from '../engine/types';
import { fmt, type Lang, type Strings } from '../i18n';

export default function Timeline({
  entries,
  lang,
  t,
  onTimelapse,
}: {
  entries: TimelineEntry[];
  lang: Lang;
  t: Strings;
  onTimelapse: () => void;
}) {
  const items = [...entries].sort((a, b) => b.turn - a.turn);
  return (
    <div className="glass rounded-2xl p-3">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-[15px] font-bold tracking-wide text-white">{t['time.title']}</h2>
        <button
          onClick={onTimelapse}
          className="rounded-full bg-amber-500/25 px-3.5 py-1.5 text-[12px] font-bold text-amber-200 transition active:scale-95"
        >
          {t['time.timelapse']}
        </button>
      </div>
      <div className="slim-scroll max-h-[55vh] space-y-0 overflow-y-auto pr-1">
        {items.map((item, i) => (
          <div key={item.id} className="relative flex gap-3 pb-4">
            {/* rail */}
            <div className="flex flex-col items-center">
              <div className="h-3 w-3 shrink-0 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,.8)]" />
              {i < items.length - 1 && <div className="w-px flex-1 bg-white/15" />}
            </div>
            <div className="flex-1 rounded-xl bg-black/40 p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-[14.5px] font-bold text-white">{item.title}</span>
                <span className="shrink-0 font-mono text-[11px] text-white/65">{fmt(item.year, lang)}</span>
              </div>
              <p className="text-[13.5px] leading-relaxed text-white/80">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
