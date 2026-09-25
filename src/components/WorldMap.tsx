/**
 * Interactive world map: a real dark dotted world map with each continent
 * personified as a tappable character marker. Marker glow reflects power;
 * a pulsing red ring marks characters currently at war.
 */
import type { Continent, ContinentId } from '../engine/types';
import { CONTINENT_IDS, powerScore } from '../engine/types';
import { CHARACTERS, fmt, type Lang, type Strings } from '../i18n';

interface Props {
  continents: Record<ContinentId, Continent>;
  selected: ContinentId | null;
  onSelect: (id: ContinentId) => void;
  lang: Lang;
  t: Strings;
}

export default function WorldMap({ continents, selected, onSelect, lang, t }: Props) {
  const scores = CONTINENT_IDS.map((id) => powerScore(continents[id]));
  const max = Math.max(...scores, 1);

  return (
    <div className="glass rounded-2xl p-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-sm font-bold tracking-wide text-white/90">{t['map.title']}</h2>
        <span className="text-[11px] text-white/65">{t['map.hint']}</span>
      </div>

      {/* map with character markers (image is exactly 2:1) */}
      <div className="relative aspect-[2/1] w-full select-none overflow-hidden rounded-xl">
        <img
          src={`${import.meta.env.BASE_URL}world-map.webp`}
          alt=""
          className="absolute inset-0 h-full w-full"
          draggable={false}
        />
        {CONTINENT_IDS.map((id) => {
          const c = continents[id];
          const ch = CHARACTERS[id];
          const score = powerScore(c);
          const strength = score / max;
          const isSelected = selected === id;
          const atWar = c.atWarWith.length > 0;
          const size = 30 + strength * 10;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className="absolute flex flex-col items-center"
              style={{
                left: `${ch.mapX}%`,
                top: `${ch.mapY}%`,
                transform: 'translate(-50%, -50%)',
              }}
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
                className="mt-0.5 max-w-[76px] truncate whitespace-nowrap rounded-full bg-black/75 px-1.5 py-px text-[9px] font-bold text-white"
                style={{ textShadow: '0 1px 3px #000' }}
              >
                {ch[lang].name} · {fmt(score, lang)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex flex-wrap gap-2 px-1">
        <span className="text-[11px] text-white/60">{t['map.legendWar']}</span>
        <span className="text-[11px] text-white/60">{t['map.legendPower']}</span>
      </div>
    </div>
  );
}
