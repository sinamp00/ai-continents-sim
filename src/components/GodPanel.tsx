/**
 * GodPanel — the user intervenes in world affairs like a deity:
 * sanctions, divine aid, provoked wars, imposed peace.
 */
import { useState } from 'react';
import type { ContinentId } from '../engine/types';
import { CONTINENT_IDS } from '../engine/types';
import { cname, type Lang, type Strings } from '../i18n';
import { PORTRAITS } from '../portraits';

export type GodAction = 'sanction' | 'aid' | 'provoke' | 'imposePeace';

interface Props {
  lang: Lang;
  t: Strings;
  onIntervene: (kind: GodAction, a: ContinentId, b?: ContinentId) => void;
  onClose: () => void;
}

const ACTIONS: { id: GodAction; icon: string; labelKey: keyof Strings; descKey: keyof Strings; color: string }[] = [
  { id: 'sanction', icon: '⚡', labelKey: 'god.sanction', descKey: 'god.sanctionDesc', color: '#f59e0b' },
  { id: 'aid', icon: '💰', labelKey: 'god.aid', descKey: 'god.aidDesc', color: '#10b981' },
  { id: 'provoke', icon: '⚔️', labelKey: 'god.provoke', descKey: 'god.provokeDesc', color: '#ef4444' },
  { id: 'imposePeace', icon: '🕊️', labelKey: 'god.peace', descKey: 'god.peaceDesc', color: '#38bdf8' },
];

export default function GodPanel({ lang, t, onIntervene, onClose }: Props) {
  const [action, setAction] = useState<GodAction | null>(null);
  const [pick, setPick] = useState<ContinentId[]>([]);

  const needsTwo = action === 'provoke' || action === 'imposePeace';

  const togglePick = (id: ContinentId) => {
    setPick((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (!needsTwo) return [id];
      return [...prev, id].slice(-2);
    });
  };

  const ready = action && (needsTwo ? pick.length === 2 : pick.length === 1);

  const confirm = () => {
    if (!ready || !action) return;
    onIntervene(action, pick[0], pick[1]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="news-card max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl border border-violet-400/25 bg-[#0d0a24]/95 p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-[20px] font-extrabold text-white">{t['god.title']}</h2>
          <button onClick={onClose} className="rounded-full bg-white/10 px-3 py-1 text-[13px] font-bold text-white/70">
            ✕
          </button>
        </div>
        <p className="mb-3 text-[14px] leading-relaxed text-white/75">{t['god.subtitle']}</p>

        {/* actions */}
        <div className="grid grid-cols-2 gap-2">
          {ACTIONS.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                setAction(a.id);
                setPick([]);
              }}
              className={`rounded-2xl border p-3 text-start transition active:scale-[0.97] ${
                action === a.id ? 'border-white/60 bg-white/15' : 'border-white/10 bg-white/5'
              }`}
            >
              <span className="text-2xl">{a.icon}</span>
              <p className="mt-1 text-[14px] font-extrabold text-white">{t[a.labelKey]}</p>
              <p className="mt-0.5 text-[12px] leading-snug text-white/65">{t[a.descKey]}</p>
            </button>
          ))}
        </div>

        {/* target picker */}
        {action && (
          <div className="mt-3">
            <p className="mb-2 text-[13px] font-bold text-white/80">
              {needsTwo ? t['god.pickTwo'] : t['god.pickTarget']}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {CONTINENT_IDS.map((id) => (
                <button
                  key={id}
                  onClick={() => togglePick(id)}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-1.5 transition active:scale-95 ${
                    pick.includes(id) ? 'border-amber-300 bg-amber-400/15' : 'border-white/10 bg-white/5'
                  }`}
                >
                  <img src={PORTRAITS[id]} alt={cname(id, lang)} className="h-11 w-11 rounded-full object-cover" />
                  <span className="max-w-full truncate text-[11px] font-bold text-white/85">{cname(id, lang)}</span>
                </button>
              ))}
            </div>
            <button
              onClick={confirm}
              disabled={!ready}
              className="mt-3 w-full rounded-2xl bg-violet-500/80 py-3 text-[15px] font-extrabold text-white transition active:scale-[0.98] disabled:opacity-40"
            >
              {t['god.confirm']}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
