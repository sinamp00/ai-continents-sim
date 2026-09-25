/**
 * Diplomacy panel — latest public statements from every AI character plus a
 * 7×7 relations matrix (green = friendly, red = hostile), treaties and
 * organizations.
 */
import type { Continent, ContinentId, Organization, Treaty } from '../engine/types';
import { CONTINENT_IDS } from '../engine/types';
import { CHARACTERS, cname, fmt, govName, type Lang, type Strings } from '../i18n';

function cellColor(r: number): string {
  if (r >= 40) return 'bg-emerald-500/70';
  if (r >= 10) return 'bg-lime-500/50';
  if (r > -10) return 'bg-white/15';
  if (r > -40) return 'bg-orange-500/60';
  return 'bg-red-500/75';
}

export default function DiplomacyPanel({
  continents,
  organizations,
  treaties,
  lang,
  t,
}: {
  continents: Record<ContinentId, Continent>;
  organizations: Organization[];
  treaties: Treaty[];
  lang: Lang;
  t: Strings;
}) {
  return (
    <div className="space-y-3">
      {/* character communiqués */}
      <div className="glass rounded-2xl p-3">
        <h2 className="mb-2 px-1 text-sm font-bold tracking-wide text-white/90">{t['diplo.communiques']}</h2>
        <div className="space-y-2">
          {CONTINENT_IDS.map((id) => {
            const c = continents[id];
            const ch = CHARACTERS[id];
            return (
              <div key={id} className="flex gap-2.5 rounded-xl bg-white/5 p-2.5">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl"
                  style={{
                    background: 'rgba(8,12,28,.85)',
                    border: `2px solid ${ch.color}`,
                    boxShadow: `0 0 10px ${ch.color}`,
                  }}
                >
                  {ch.emoji}
                </span>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-white">
                    {ch[lang].name}
                    <span className="ms-1.5 font-normal text-white/45">{ch[lang].title}</span>
                    <span className="ms-1.5 font-normal capitalize text-white/45">· {govName(c.government, lang)}</span>
                    {c.atWarWith.length > 0 && <span className="ms-1.5 text-red-400">{t['diplo.atWar']}</span>}
                  </p>
                  <p className="text-[13px] italic leading-snug text-white/75">“{c.statement}”</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* relations matrix */}
      <div className="glass rounded-2xl p-3">
        <h2 className="mb-2 px-1 text-sm font-bold tracking-wide text-white/90">{t['diplo.matrix']}</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-center text-[11px]">
            <thead>
              <tr>
                <th className="p-1" />
                {CONTINENT_IDS.map((id) => (
                  <th key={id} className="p-1 text-[15px]" title={cname(id, lang)}>
                    {CHARACTERS[id].emoji}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CONTINENT_IDS.map((row) => (
                <tr key={row}>
                  <td className="p-1 text-[15px]" title={cname(row, lang)}>
                    {CHARACTERS[row].emoji}
                  </td>
                  {CONTINENT_IDS.map((col) => (
                    <td key={col} className="p-0.5">
                      {row === col ? (
                        <div className="mx-auto h-7 w-7 rounded-md bg-white/5 text-white/25">—</div>
                      ) : (
                        <div
                          className={`mx-auto flex h-7 w-7 items-center justify-center rounded-md font-mono text-[9px] font-bold text-white ${cellColor(continents[row].relations[col])}`}
                          title={`${cname(row, lang)} → ${cname(col, lang)}: ${fmt(continents[row].relations[col], lang)}`}
                        >
                          {fmt(continents[row].relations[col], lang)}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* organizations & treaties */}
      <div className="glass rounded-2xl p-3">
        <h2 className="mb-2 px-1 text-sm font-bold tracking-wide text-white/90">{t['diplo.institutions']}</h2>
        {organizations.length === 0 && treaties.length === 0 && (
          <p className="p-3 text-center text-[12px] text-white/40">{t['diplo.empty']}</p>
        )}
        <div className="space-y-2">
          {organizations.map((o) => (
            <div key={o.id} className="rounded-xl bg-teal-500/10 p-2.5 text-[12px]">
              <p className="font-bold text-teal-200">🏛️ {o.name}</p>
              <p className="text-white/60">
                {fmt(o.foundedYear, lang)} · {cname(o.founder, lang)} · {o.members.map((mm) => CHARACTERS[mm].emoji).join(' ')}
              </p>
              <p className="italic text-white/55">“{o.purpose}”</p>
            </div>
          ))}
          {treaties.slice(-5).reverse().map((tr) => (
            <div key={tr.id} className="rounded-xl bg-violet-500/10 p-2.5 text-[12px]">
              <p className="font-bold text-violet-200">📜 {tr.title}</p>
              <p className="text-white/60">
                {fmt(tr.year, lang)} · {tr.parties.map((p) => `${CHARACTERS[p].emoji} ${cname(p, lang)}`).join(' × ')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
