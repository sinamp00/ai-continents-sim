/**
 * AI Continents Civilization Simulator — root component.
 *
 * Game loop: every tick the current AI brain (live LLM or offline fallback)
 * produces one decision per continent, then the turn engine applies them.
 * State lives in a ref for the async loop; a version counter triggers renders.
 * Fully bilingual: Persian (default, RTL) and English, toggleable in Controls.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AiMode, ContinentId, GameState, SaveSlot } from './engine/types';
import { createInitialState, runTurn } from './engine/simulation';
import { fetchLlmDecisions } from './engine/llm';
import { decideLocally } from './engine/localBrain';
import {
  autosave,
  clearAutosave,
  deleteSave,
  listSaves,
  loadAutosave,
  loadSave,
  saveGame,
} from './engine/persistence';
import { STRINGS, type Lang } from './i18n';
import WorldMap from './components/WorldMap';
import EventFeed from './components/EventFeed';
import Dashboard from './components/Dashboard';
import Rankings from './components/Rankings';
import Timeline from './components/Timeline';
import DiplomacyPanel from './components/DiplomacyPanel';
import Controls from './components/Controls';
import BottomNav, { type Tab } from './components/BottomNav';

export default function App() {
  const stateRef = useRef<GameState>(createInitialState('fa'));
  const [, setVersion] = useState(0);
  const [tab, setTab] = useState<Tab>('map');
  const [running, setRunning] = useState(false);
  const [speedMs, setSpeedMs] = useState(4000);
  const [thinking, setThinking] = useState(false);
  const [saves, setSaves] = useState<SaveSlot[]>(() => listSaves());
  const [restored, setRestored] = useState(false);
  const [lang, setLang] = useState<Lang>('fa');
  const loopRef = useRef<number | null>(null);

  const t = STRINGS[lang];
  const render = useCallback(() => setVersion((v) => v + 1), []);

  /** Apply language + text direction to the document. */
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    document.title =
      lang === 'fa' ? 'قاره‌های هوش مصنوعی — شبیه‌ساز تمدن' : 'AI Continents — Civilization Simulator';
  }, [lang]);

  /** Restore autosave once on launch. */
  useEffect(() => {
    const saved = loadAutosave();
    if (saved && saved.turn > 1) {
      stateRef.current = saved;
      render();
    }
    setRestored(true);
  }, [render]);

  /** Simulate exactly one turn. */
  const doTurn = useCallback(async () => {
    const s = stateRef.current;
    const l = langRef.current;
    setThinking(true);
    try {
      let decisions;
      if (s.aiMode === 'llm') {
        try {
          decisions = await fetchLlmDecisions(s, l);
          s.llmStatus = 'ok';
        } catch {
          // LLM unreachable → seamless fallback to the local brain.
          decisions = decideLocally(s, l);
          s.llmStatus = 'fallback';
        }
      } else {
        decisions = decideLocally(s, l);
      }
      stateRef.current = runTurn(s, decisions, l);
      if (stateRef.current.turn % 5 === 0) autosave(stateRef.current);
    } finally {
      setThinking(false);
      render();
    }
  }, [render]);

  const langRef = useRef(lang);
  langRef.current = lang;
  const doTurnRef = useRef(doTurn);
  doTurnRef.current = doTurn;

  /** Main loop — setTimeout chain so a slow LLM call never overlaps turns. */
  useEffect(() => {
    if (!running || !restored) return;
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      await doTurnRef.current();
      if (cancelled) return;
      loopRef.current = window.setTimeout(tick, speedMs);
    };
    loopRef.current = window.setTimeout(tick, 600);
    return () => {
      cancelled = true;
      if (loopRef.current) window.clearTimeout(loopRef.current);
    };
  }, [running, speedMs, restored]);

  const state = stateRef.current;
  const selected = state.selectedContinent
    ? state.continents[state.selectedContinent]
    : state.continents.asia;

  const setAiMode = (m: AiMode) => {
    stateRef.current = { ...stateRef.current, aiMode: m, llmStatus: 'ok' };
    render();
  };

  const handleNew = () => {
    if (loopRef.current) window.clearTimeout(loopRef.current);
    setRunning(false);
    clearAutosave();
    stateRef.current = createInitialState(langRef.current);
    setTab('map');
    render();
  };

  const selectContinent = (id: ContinentId) => {
    stateRef.current = { ...stateRef.current, selectedContinent: id };
    setTab('stats');
    render();
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-3 pb-28 pt-4">
      {/* header */}
      <header className="mb-3 flex items-center gap-2.5 px-1">
        <span className="text-3xl">🌍</span>
        <div>
          <h1 className="text-[17px] font-extrabold leading-tight text-white">
            {t['app.title']}
            <span className="block text-[11px] font-medium text-white/50">{t['app.subtitle']}</span>
          </h1>
        </div>
      </header>

      <div className="mb-3">
        <Controls
          state={state}
          running={running}
          speedMs={speedMs}
          thinking={thinking}
          onToggleRun={() => setRunning((r) => !r)}
          onSpeed={setSpeedMs}
          onAiMode={setAiMode}
          onStep={() => void doTurn()}
          onNew={handleNew}
          saves={saves}
          onSave={(name) => setSaves(saveGame(name, stateRef.current))}
          onLoad={(name) => {
            const loaded = loadSave(name);
            if (loaded) {
              setRunning(false);
              stateRef.current = loaded;
              render();
            }
          }}
          onDelete={(name) => setSaves(deleteSave(name))}
          lang={lang}
          t={t}
          onLang={setLang}
        />
      </div>

      {/* tab content */}
      {tab === 'map' && (
        <div className="space-y-3">
          <WorldMap
            continents={state.continents}
            selected={state.selectedContinent}
            onSelect={(id) => {
              stateRef.current = { ...stateRef.current, selectedContinent: id };
              render();
            }}
            lang={lang}
            t={t}
          />
          <Dashboard continent={selected} lang={lang} t={t} />
        </div>
      )}
      {tab === 'feed' && <EventFeed feed={state.feed} lang={lang} t={t} />}
      {tab === 'stats' && <Dashboard continent={selected} lang={lang} t={t} />}
      {tab === 'ranks' && <Rankings continents={state.continents} onSelect={selectContinent} lang={lang} t={t} />}
      {tab === 'time' && <Timeline entries={state.timeline} lang={lang} t={t} />}
      {tab === 'diplo' && (
        <DiplomacyPanel
          continents={state.continents}
          organizations={state.organizations}
          treaties={state.treaties}
          lang={lang}
          t={t}
        />
      )}

      <footer className="mt-6 text-center text-[10px] text-white/30">
        {t['footer']} · v2.0
      </footer>

      <BottomNav tab={tab} onTab={setTab} t={t} />
    </div>
  );
}
