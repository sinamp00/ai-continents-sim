/**
 * Character dashboard: the continent personified — painted portrait,
 * title, bio — plus stat bars, government, relations, alliances and wars.
 */
import type { Continent } from '../engine/types';
import { CONTINENT_IDS, powerScore } from '../engine/types';
import { CHARACTERS, cname, fmt, govName, moodEmoji, moodName, type Lang, type Strings } from '../i18n';
import { PORTRAITS } from '../portraits';

const STAT_META: { key: keyof Continent['stats']; labelKey: keyof Strings; color: string }[] = [
  { key: 'economy', labelKey: 'stat.economy', color: 'bg-amber-400' },
  { key: 'military', labelKey: 'stat.military', color: 'bg-red-400' },
  { key: 'technology', labelKey: 'stat.technology', color: 'bg-cyan-400' },
  { key: 'resources', labelKey: 'stat.resources', color: 'bg-orange-400' },
  { key: 'happiness', labelKey: 'stat.happiness', color: 'bg-emerald-400' },
];

function StatBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/15">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.round(value)}%`, transition: 'width .5s' }} />
    </div>
  );
}

function relColor(r: number): string {
  if (r >= 40) return 'text-emerald-300';
  if (r >= 10) return 'text-lime-300';
  if (r > -10) return 'text-white/80';
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
  const atWar = continent.atWarWith.length > 0;
  const pop =
    s.population >= 1
      ? `${fmt(s.population, lang)}${t['dash.unitM']}`
      : `${fmt(s.population * 1000, lang)}${t['dash.unitK']}`;

  return (
    <div className="glass rounded-2xl p-4">
      {/* character header */}
      <div className="mb-3 flex items-center gap-3.5">
        <img
          src={PORTRAITS[continent.id]}
          alt={ch[lang].name}
          className="h-20 w-20 shrink-0 rounded-2xl border-2 object-cover"
          style={{
            borderColor: atWar ? '#ef4444' : ch.color,
            boxShadow: `0 0 20px ${atWar ? '#ef4444' : ch.color}`,
          }}
        />
        <div className="min-w-0">
          <h2 className="text-[21px] font-extrabold leading-tight text-white">{ch[lang].name}</h2>
          <p className="text-[13.5px] font-semibold" style={{ color: ch.color }}>
            {ch[lang].title}
          </p>
          <p className="mt-0.5 text-[12.5px] text-white/80">
            {t['dash.government']}: {govName(continent.government, lang)} · ⚡{fmt(powerScore(continent), lang)}{' '}
            {t['dash.power']}
          </p>
          <p className="mt-0.5 text-[12.5px] text-white/85">
            {moodEmoji(continent.mood)} {moodName(continent.mood, lang)}
            <span className="text-white/60"> · 🎬 {continent.activity}</span>
          </p>
        </div>
      </div>

      <p className="mb-2 rounded-xl bg-black/40 p-3 text-[13.5px] leading-relaxed text-white/85">
        {ch[lang].bio}
      </p>
      <p className="mb-3 rounded-xl bg-black/40 p-3 text-[14.5px] italic leading-relaxed text-white">
        “{continent.statement}”
      </p>

      <div className="space-y-3">
        <div className="flex items-center gap-2.5 text-[14px]">
          <span className="w-28 shrink-0 font-medium text-white/80">{t['stat.population']}</span>
          <span className="font-bold text-white">{pop}</span>
        </div>
        {STAT_META.map((meta) => (
          <div key={meta.key} className="flex items-center gap-2.5 text-[14px]">
            <span className="w-28 shrink-0 font-medium text-white/80">{t[meta.labelKey]}</span>
            <StatBar value={s[meta.key]} color={meta.color} />
            <span className="w-9 shrink-0 text-end font-mono font-bold text-white/90">{fmt(s[meta.key], lang)}</span>
          </div>
        ))}
      </div>

      {/* diplomatic status chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {continent.alliances.map((a) => (
          <span key={a} className="rounded-full bg-blue-500/25 px-3 py-1.5 text-[12.5px] font-semibold text-blue-100">
            🤝 {cname(a, lang)}
          </span>
        ))}
        {continent.atWarWith.map((a) => (
          <span key={a} className="war-pulse rounded-full bg-red-500/30 px-3 py-1.5 text-[12.5px] font-bold text-red-100">
            {t['dash.warWith']} {cname(a, lang)}
          </span>
        ))}
        {continent.organizations.length > 0 && (
          <span className="rounded-full bg-teal-500/25 px-3 py-1.5 text-[12.5px] font-semibold text-teal-100">
            🏛️ {fmt(continent.organizations.length, lang)} {t['dash.orgs']}
          </span>
        )}
      </div>

      {/* relations */}
      <h3 className="mb-2 mt-5 text-[12px] font-bold uppercase tracking-wider text-white/75">{t['dash.relations']}</h3>
      <div className="grid grid-cols-2 gap-2">
        {CONTINENT_IDS.filter((id) => id !== continent.id).map((id) => {
          const r = continent.relations[id];
          return (
            <div key={id} className="flex items-center justify-between gap-1 rounded-xl bg-black/40 px-3 py-2 text-[13px]">
              <span className="flex min-w-0 items-center gap-1.5 text-white/90">
                <img src={PORTRAITS[id]} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />
                <span className="truncate font-medium">{cname(id, lang)}</span>
              </span>
              <span className={`shrink-0 font-mono font-bold ${relColor(r)}`}>
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
