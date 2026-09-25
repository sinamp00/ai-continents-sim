/**
 * Character dashboard: the continent personified — avatar, title, bio —
 * plus stat bars, government, relations, alliances and wars.
 */
import type { Continent } from '../engine/types';
import { CONTINENT_IDS, powerScore } from '../engine/types';
import { CHARACTERS, cname, fmt, govName, moodEmoji, moodName, type Lang, type Strings } from '../i18n';

const STAT_META: { key: keyof Continent['stats']; labelKey: keyof Strings; color: string }[] = [
  { key: 'economy', labelKey: 'stat.economy', color: 'bg-amber-400' },
  { key: 'military', labelKey: 'stat.military', color: 'bg-red-400' },
  { key: 'technology', labelKey: 'stat.technology', color: 'bg-cyan-400' },
  { key: 'resources', labelKey: 'stat.resources', color: 'bg-orange-400' },
  { key: 'happiness', labelKey: 'stat.happiness', color: 'bg-emerald-400' },
];

function StatBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.round(value)}%`, transition: 'width .5s' }} />
    </div>
  );
}

function relColor(r: number): string {
  if (r >= 40) return 'text-emerald-300';
  if (r >= 10) return 'text-lime-300';
  if (r > -10) return 'text-white/70';
  if (r > -40) return 'text-orange-300';
  return 'text-red-300';
}

export default function Dashboard({
  continent,
  lang,
  t,
}: {
  continent: Continent;
  lang: Lang;
  t: Strings;
}) {
  const s = continent.stats;
  const ch = CHARACTERS[continent.id];
  const pop =
    s.population >= 1
      ? `${fmt(s.population, lang)}${t['dash.unitM']}`
      : `${fmt(s.population * 1000, lang)}${t['dash.unitK']}`;

  return (
    <div className="glass rounded-2xl p-4">
      {/* character header */}
      <div className="mb-2 flex items-center gap-3">
        <span
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-4xl"
          style={{
            background: 'rgba(8,12,28,.85)',
            border: `2px solid ${ch.color}`,
            boxShadow: `0 0 18px ${ch.color}`,
          }}
        >
          {ch.emoji}
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold text-white">{ch[lang].name}</h2>
          <p className="text-[12px] font-semibold" style={{ color: ch.color }}>
            {ch[lang].title}
          </p>
          <p className="text-[11px] text-white/70">
            {t['dash.government']}: {govName(continent.government, lang)} · ⚡{fmt(powerScore(continent), lang)} {t['dash.power']}
          </p>
          <p className="mt-0.5 text-[11px] text-white/80">
            {moodEmoji(continent.mood)} {moodName(continent.mood, lang)}
            <span className="text-white/50"> · 🎬 {continent.activity}</span>
          </p>
        </div>
      </div>

      <p className="mb-2 rounded-xl bg-white/5 p-2.5 text-[12px] leading-snug text-white/70">
        {ch[lang].bio}
      </p>
      <p className="mb-3 rounded-xl bg-white/5 p-2.5 text-[13px] italic leading-snug text-white/80">
        “{continent.statement}”
      </p>

      <div className="space-y-2.5">
        <div className="flex items-center gap-2 text-[13px]">
          <span className="w-24 shrink-0 text-white/70">{t['stat.population']}</span>
          <span className="font-semibold text-white">{pop}</span>
        </div>
        {STAT_META.map((meta) => (
          <div key={meta.key} className="flex items-center gap-2 text-[13px]">
            <span className="w-24 shrink-0 text-white/70">{t[meta.labelKey]}</span>
            <StatBar value={s[meta.key]} color={meta.color} />
            <span className="w-8 text-right font-mono text-white/80">{fmt(s[meta.key], lang)}</span>
          </div>
        ))}
      </div>

      {/* diplomatic status chips */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {continent.alliances.map((a) => (
          <span key={a} className="rounded-full bg-blue-500/20 px-2.5 py-1 text-[11px] text-blue-200">
            🤝 {cname(a, lang)}
          </span>
        ))}
        {continent.atWarWith.map((a) => (
          <span key={a} className="war-pulse rounded-full bg-red-500/25 px-2.5 py-1 text-[11px] font-bold text-red-200">
            {t['dash.warWith']} {cname(a, lang)}
          </span>
        ))}
        {continent.organizations.length > 0 && (
          <span className="rounded-full bg-teal-500/20 px-2.5 py-1 text-[11px] text-teal-200">
            🏛️ {fmt(continent.organizations.length, lang)} {t['dash.orgs']}
          </span>
        )}
      </div>

      {/* relations */}
      <h3 className="mb-1.5 mt-4 text-xs font-bold uppercase tracking-wider text-white/65">{t['dash.relations']}</h3>
      <div className="grid grid-cols-2 gap-1.5">
        {CONTINENT_IDS.filter((id) => id !== continent.id).map((id) => {
          const r = continent.relations[id];
          return (
            <div key={id} className="flex items-center justify-between rounded-lg bg-white/5 px-2.5 py-1.5 text-[12px]">
              <span className="text-white/80">
                {CHARACTERS[id].emoji} {cname(id, lang)}
              </span>
              <span className={`font-mono font-bold ${relColor(r)}`}>
                {r > 0 ? '+' : ''}
                {fmt(r, lang)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
