/**
 * Civilization rankings — all 7 characters ordered by overall power score.
 */
import type { Continent, ContinentId } from '../engine/types';
import { CONTINENT_IDS, powerScore } from '../engine/types';
import { CHARACTERS, cname, fmt, type Lang, type Strings } from '../i18n';
import { PORTRAITS } from '../portraits';

const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣'];

export default function Rankings({
  continents,
  onSelect,
  lang,
  t,
}: {
  continents: Record<ContinentId, Continent>;
  onSelect: (id: ContinentId) => void;
  lang: Lang;
  t: Strings;
}) {
  const ranked = [...CONTINENT_IDS].sort((a, b) => powerScore(continents[b]) - powerScore(continents[a]));
  const max = powerScore(continents[ranked[0]]) || 1;

  return (
    <div className="glass rounded-2xl p-3">
      <h2 className="mb-3 px-1 text-[15px] font-bold tracking-wide text-white">{t['ranks.title']}</h2>
      <div className="space-y-2">
        {ranked.map((id, i) => {
          const c = continents[id];
          const score = powerScore(c);
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className="w-full rounded-xl bg-black/40 p-3 text-left transition active:scale-[0.99] rtl:text-right"
            >
              <div className="mb-1.5 flex items-center justify-between gap-2 text-[14.5px]">
                <span className="flex min-w-0 items-center gap-2 font-semibold text-white">
                  <span className="shrink-0">{MEDALS[i]}</span>
                  <img src={PORTRAITS[id]} alt="" className="h-9 w-9 shrink-0 rounded-full border object-cover" style={{ borderColor: CHARACTERS[id].color }} />
                  <span className="truncate">
                    {cname(id, lang)}
                    <span className="ms-1.5 text-[12px] font-normal text-white/65">{CHARACTERS[id][lang].title}</span>
                    {c.atWarWith.length > 0 && <span className="ms-1 text-red-400">⚔️</span>}
                  </span>
                </span>
                <span className="shrink-0 font-mono font-bold text-white/85">{fmt(score, lang)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(score / max) * 100}%`,
                    background: c.color,
                    transition: 'width .5s',
                  }}
                />
              </div>
              <div className="mt-1.5 flex gap-3.5 font-mono text-[11.5px] text-white/75">
                <span>💰{fmt(c.stats.economy, lang)}</span>
                <span>⚔️{fmt(c.stats.military, lang)}</span>
                <span>🔬{fmt(c.stats.technology, lang)}</span>
                <span>😊{fmt(c.stats.happiness, lang)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
