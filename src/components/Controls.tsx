/**
 * Simulation controls: play/pause, speed, AI brain mode, language,
 * save/load/new.
 */
import { useState } from 'react';
import type { AiMode, GameState, SaveSlot } from '../engine/types';
import { fmt, type Lang, type Strings } from '../i18n';

const SPEEDS = [
  { label: '1×', ms: 4000 },
  { label: '2×', ms: 2000 },
  { label: '4×', ms: 1000 },
];

interface Props {
  state: GameState;
  running: boolean;
  speedMs: number;
  thinking: boolean;
  muted: boolean;
  onToggleRun: () => void;
  onSpeed: (ms: number) => void;
  onAiMode: (m: AiMode) => void;
  onStep: () => void;
  onNew: () => void;
  onToggleMute: () => void;
  onGod: () => void;
  saves: SaveSlot[];
  onSave: (name: string) => void;
  onLoad: (name: string) => void;
  onDelete: (name: string) => void;
  lang: Lang;
  t: Strings;
  onLang: (l: Lang) => void;
}

export default function Controls(p: Props) {
  const [showSaves, setShowSaves] = useState(false);
  const [saveName, setSaveName] = useState('');
  const t = p.t;

  return (
    <div className="glass rounded-2xl p-3">
      {/* turn + year */}
      <div className="mb-2.5 flex items-center justify-between px-1">
        <div>
          <p className="font-mono text-2xl font-bold text-white">{fmt(p.state.year, p.lang)}</p>
          <p className="text-[12px] text-white/70">
            {t['ctrl.turn']} {fmt(p.state.turn, p.lang)}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {/* language toggle */}
          <button
            onClick={() => p.onLang(p.lang === 'fa' ? 'en' : 'fa')}
            className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white/80 transition active:scale-95"
            title="Language / زبان"
          >
            {p.lang === 'fa' ? 'فا | EN' : 'EN | فا'}
          </button>
          {/* AI brain badge */}
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
              p.state.aiMode === 'llm'
                ? p.state.llmStatus === 'ok'
                  ? 'bg-emerald-500/25 text-emerald-200'
                  : 'bg-amber-500/25 text-amber-200'
                : 'bg-white/10 text-white/60'
            }`}
          >
            {p.state.aiMode === 'llm'
              ? p.state.llmStatus === 'ok'
                ? t['ctrl.liveAi']
                : t['ctrl.aiFallback']
              : t['ctrl.local']}
          </span>
          {/* sound toggle */}
          <button
            onClick={p.onToggleMute}
            className={`rounded-full px-3 py-1 text-[12px] font-bold transition active:scale-95 ${
              p.muted ? 'bg-white/10 text-white/60' : 'bg-violet-500/30 text-violet-200'
            }`}
            title={p.muted ? t['ctrl.soundOff'] : t['ctrl.soundOn']}
          >
            {p.muted ? t['ctrl.soundOff'] : t['ctrl.soundOn']}
          </button>
          {/* god mode */}
          <button
            onClick={p.onGod}
            className="rounded-full bg-gradient-to-r from-amber-500/40 to-orange-500/40 px-3 py-1 text-[12px] font-bold text-amber-200 transition active:scale-95"
            title={t['ctrl.god']}
          >
            {t['ctrl.god']}
          </button>
          {p.thinking && <span className="animate-pulse text-[12px] text-cyan-300">{t['ctrl.thinking']}</span>}
        </div>
      </div>

      {/* transport */}
      <div className="mb-2.5 flex items-center gap-2">
        <button
          onClick={p.onToggleRun}
          className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition active:scale-[0.98] ${
            p.running ? 'bg-red-500/80 text-white' : 'bg-emerald-500/80 text-white'
          }`}
        >
          {p.running ? t['ctrl.pause'] : t['ctrl.play']}
        </button>
        <button
          onClick={p.onStep}
          disabled={p.running || p.thinking}
          className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white/80 transition active:scale-[0.98] disabled:opacity-40"
        >
          ⏭
        </button>
      </div>

      {/* speed */}
      <div className="mb-2.5 flex gap-2">
        {SPEEDS.map((s) => (
          <button
            key={s.label}
            onClick={() => p.onSpeed(s.ms)}
            className={`flex-1 rounded-xl py-1.5 text-[12px] font-bold transition ${
              p.speedMs === s.ms ? 'bg-indigo-500/80 text-white' : 'bg-white/10 text-white/60'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* AI mode */}
      <div className="mb-2.5 grid grid-cols-2 gap-2">
        <button
          onClick={() => p.onAiMode('llm')}
          className={`rounded-xl py-2 text-[12px] font-bold transition ${
            p.state.aiMode === 'llm' ? 'bg-cyan-500/80 text-white' : 'bg-white/10 text-white/60'
          }`}
        >
          {t['ctrl.realAi']}
        </button>
        <button
          onClick={() => p.onAiMode('local')}
          className={`rounded-xl py-2 text-[12px] font-bold transition ${
            p.state.aiMode === 'local' ? 'bg-cyan-500/80 text-white' : 'bg-white/10 text-white/60'
          }`}
        >
          {t['ctrl.offline']}
        </button>
      </div>

      {/* save / load / new */}
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => setShowSaves((v) => !v)} className="rounded-xl bg-white/10 py-2 text-[12px] font-bold text-white/80">
          {t['ctrl.saves']}
        </button>
        <button
          onClick={() => {
            const name = saveName.trim() || `${t['ctrl.turn']} ${fmt(p.state.turn, p.lang)}`;
            p.onSave(name);
            setSaveName('');
          }}
          className="rounded-xl bg-white/10 py-2 text-[12px] font-bold text-white/80"
        >
          {t['ctrl.quickSave']}
        </button>
        <button
          onClick={() => {
            if (window.confirm(t['ctrl.newConfirm'])) p.onNew();
          }}
          className="rounded-xl bg-white/10 py-2 text-[12px] font-bold text-white/80"
        >
          {t['ctrl.new']}
        </button>
      </div>

      {showSaves && (
        <div className="mt-2.5 space-y-2 rounded-xl bg-black/30 p-2.5">
          <div className="flex gap-2">
            <input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder={t['ctrl.savePh']}
              className="min-w-0 flex-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-[12px] text-white placeholder:text-white/35"
            />
            <button
              onClick={() => {
                p.onSave(saveName.trim() || `${t['ctrl.turn']} ${fmt(p.state.turn, p.lang)}`);
                setSaveName('');
              }}
              className="rounded-lg bg-indigo-500/80 px-3 py-1.5 text-[12px] font-bold text-white"
            >
              {t['ctrl.save']}
            </button>
          </div>
          {p.saves.length === 0 && <p className="py-2 text-center text-[12px] text-white/40">{t['ctrl.noSaves']}</p>}
          {p.saves.map((s) => (
            <div key={s.name} className="flex items-center justify-between rounded-lg bg-white/5 px-2.5 py-2 text-[12px]">
              <div className="min-w-0">
                <p className="truncate font-semibold text-white/90">{s.name}</p>
                <p className="text-[10px] text-white/60">
                  {fmt(s.year, p.lang)} · {t['ctrl.turn']} {fmt(s.turn, p.lang)} · {new Date(s.savedAt).toLocaleDateString(p.lang === 'fa' ? 'fa-IR' : 'en-US')}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button onClick={() => p.onLoad(s.name)} className="rounded-lg bg-emerald-500/70 px-2.5 py-1 font-bold text-white">
                  {t['ctrl.load']}
                </button>
                <button onClick={() => p.onDelete(s.name)} className="rounded-lg bg-red-500/60 px-2.5 py-1 font-bold text-white">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
