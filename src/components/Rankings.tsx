/**
 * Civilization rankings — all 7 characters ordered by overall power score.
 */
import type { Continent, ContinentId } from '../engine/types';
import { CONTINENT_IDS, powerScore } from '../engine/types';
import { CHARACTERS, cname, fmt, type Lang, type Strings } from '../i18n';

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
      <h2 className="mb-3 px-1 text-sm font-bold tracking-wide text-white/90">{t['ranks.title']}</h2>
      <div className="space-y-2">
        {ranked.map((id, i) => {
          const c = continents[id];
          const score = powerScore(c);
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className="w-full rounded-xl bg-white/5 p-2.5 text-left transition active:scale-[0.99] rtl:text-right"
            >
              <div className="mb-1 flex items-center justify-between text-[13px]">
                <span className="font-semibold text-white">
                  {MEDALS[i]} {CHARACTERS[id].emoji} {cname(id, lang)}
                  <span className="ms-1.5 text-[11px] font-normal text-white/45">{CHARACTERS[id][lang].title}</span>
                  {c.atWarWith.length > 0 && <span className="ms-1 text-red-400">⚔️</span>}
                </span>
                <span className="font-mono text-white/70">{fmt(score, lang)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(score / max) * 100}%`,
                    background: c.color,
                    transition: 'width .5s',
                  }}
                />
              </div>
              <div className="mt-1 flex gap-3 font-mono text-[10px] text-white/45">
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
