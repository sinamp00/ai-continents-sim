/**
 * AI Continents Civilization Simulator — root component. (v4 "Epic")
 *
 * Game loop: every tick the current AI brain (live LLM or offline fallback)
 * produces one decision per continent, then the turn engine applies them.
 * State lives in a ref for the async loop; a version counter triggers renders.
 * Cinematic events from the engine drive particle FX, screen shake and the
 * breaking-news cutscene (the sim pauses while news plays, then resumes).
 * Fully bilingual: Persian (default, RTL) and English, toggleable in Controls.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CONTINENT_IDS,
  type AiMode,
  type CinematicEvent,
  type Continent,
  type ContinentId,
  type FeedEvent,
  type FeedKind,
  type GameState,
  type SaveSlot,
} from './engine/types';
import { createInitialState, runTurn } from './engine/simulation';
import { fetchLlmDecisions } from './engine/llm';
import { decideLocally } from './engine/localBrain';
import { m } from './engine/messages';
import {
  autosave,
  clearAutosave,
  deleteSave,
  listSaves,
  loadAutosave,
  loadSave,
  saveGame,
} from './engine/persistence';
import { cname, STRINGS, type Lang } from './i18n';
import { playSfx, setMuted as setAudioMuted, startMusic, unlockAudio } from './audio';
import ZoomMap, { type MapFx } from './components/ZoomMap';
import BreakingNews from './components/BreakingNews';
import GodPanel, { type GodAction } from './components/GodPanel';
import Timelapse from './components/Timelapse';
import EventFeed from './components/EventFeed';
import Dashboard from './components/Dashboard';
import Rankings from './components/Rankings';
import Timeline from './components/Timeline';
import DiplomacyPanel from './components/DiplomacyPanel';
import Controls from './components/Controls';
import BottomNav, { type Tab } from './components/BottomNav';

const uid = () => Math.random().toString(36).slice(2, 10);

/** Old saves predate cinematic/history fields — guard before use. */
function guardSave(g: GameState): GameState {
  return { ...g, cinematic: g.cinematic ?? [], history: g.history ?? [] };
}

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
  // v4: cinematic layer state
  const [news, setNews] = useState<CinematicEvent[]>([]);
  const [godOpen, setGodOpen] = useState(false);
  const [timelapseOpen, setTimelapseOpen] = useState(false);
  const [fx, setFx] = useState<MapFx[]>([]);
  const [muted, setMuted] = useState(false);
  const fxId = useRef(0);
  const resumeRef = useRef(false);
  const runningRef = useRef(running);
  runningRef.current = running;
  const loopRef = useRef<number | null>(null);

  const t = STRINGS[lang];
  const render = useCallback(() => setVersion((v) => v + 1), []);

  const pushFx = useCallback((f: Omit<MapFx, 'id'>) => {
    const id = ++fxId.current;
    setFx((prev) => [...prev, { ...f, id }].slice(-30));
  }, []);

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
      stateRef.current = guardSave(saved);
      render();
    }
    setRestored(true);
  }, [render]);

  /** Simulate exactly one turn, then play the cinematic layer. */
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

      // --- cinematic layer: FX + breaking news ---
      const bigNews: CinematicEvent[] = [];
      for (const ev of stateRef.current.cinematic) {
        if (ev.kind === 'battle') {
          pushFx({ a: ev.a, b: ev.b, color: '#f97316', big: ev.big });
        } else if (ev.kind === 'war') {
          pushFx({ a: ev.a, b: ev.b, color: '#ef4444', big: true });
          bigNews.push(ev);
        } else if (ev.kind === 'peace') {
          pushFx({ a: ev.a, b: ev.b, color: '#34d399' });
          bigNews.push(ev);
        } else if (ev.kind === 'alliance') {
          pushFx({ a: ev.a, b: ev.b, color: '#60a5fa' });
          if (ev.major) bigNews.push(ev);
        } else if (ev.kind === 'organization') {
          bigNews.push(ev);
        } else if (ev.kind === 'treaty') {
          pushFx({ a: ev.a, b: ev.b, color: '#fbbf24' });
        }
      }
      if (bigNews.length > 0) {
        resumeRef.current = runningRef.current;
        if (runningRef.current) setRunning(false);
        setNews(bigNews);
      }
    } finally {
      setThinking(false);
      render();
    }
  }, [render, pushFx]);

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

  const toggleRun = () => {
    setRunning((r) => {
      if (!r) {
        unlockAudio();
        startMusic();
      }
      return !r;
    });
  };

  const toggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      setAudioMuted(next);
      return next;
    });
  };

  const handleNewsDone = () => {
    setNews([]);
    if (resumeRef.current) {
      resumeRef.current = false;
      setRunning(true);
    }
  };

  const handleNew = () => {
    if (loopRef.current) window.clearTimeout(loopRef.current);
    setRunning(false);
    setNews([]);
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

  /** God mode: intervene directly in the world. */
  const intervene = useCallback(
    (kind: GodAction, a: ContinentId, b?: ContinentId) => {
      const s = stateRef.current;
      const l = langRef.current;
      const tt = STRINGS[l];
      const clone = (id: ContinentId): Continent => {
        const c = s.continents[id];
        return {
          ...c,
          stats: { ...c.stats },
          relations: { ...c.relations },
          alliances: [...c.alliances],
          atWarWith: [...c.atWarWith],
          organizations: [...c.organizations],
        };
      };
      const ca = clone(a);
      const continents = { ...s.continents, [a]: ca };
      let cb: Continent | undefined;
      if (b) {
        cb = clone(b);
        continents[b] = cb;
      }
      const an = cname(a, l);
      let feedKind: FeedKind = 'event';
      let text = '';

      if (kind === 'sanction') {
        ca.stats.economy = Math.max(5, ca.stats.economy - 18);
        ca.stats.happiness = Math.max(5, ca.stats.happiness - 8);
        ca.mood = 'furious';
        text = m(l, 'god.sanction', { a: an });
        pushFx({ a, color: '#fbbf24', big: true });
        playSfx('thunder');
      } else if (kind === 'aid') {
        ca.stats.economy = Math.min(100, ca.stats.economy + 14);
        ca.stats.happiness = Math.min(100, ca.stats.happiness + 10);
        ca.mood = 'hopeful';
        text = m(l, 'god.aid', { a: an });
        pushFx({ a, color: '#34d399', big: true });
        playSfx('coin');
      } else if (kind === 'provoke' && cb && b) {
        if (!ca.atWarWith.includes(b)) ca.atWarWith.push(b);
        if (!cb.atWarWith.includes(a)) cb.atWarWith.push(a);
        ca.alliances = ca.alliances.filter((x) => x !== b);
        cb.alliances = cb.alliances.filter((x) => x !== a);
        ca.relations[b] = -100;
        cb.relations[a] = -100;
        ca.mood = 'furious';
        cb.mood = 'furious';
        text = m(l, 'god.provoke', { a: an, b: cname(b, l) });
        feedKind = 'war';
        pushFx({ a, b, color: '#ef4444', big: true });
        pushFx({ a: b, color: '#ef4444', big: true });
        playSfx('horn');
      } else if (kind === 'imposePeace' && cb && b) {
        for (const id of CONTINENT_IDS) {
          const cc = id === a ? ca : id === b ? cb : clone(id);
          cc.atWarWith = cc.atWarWith.filter((x) => x !== a && x !== b);
          continents[id] = cc;
        }
        ca.relations[b] = 15;
        cb.relations[a] = 15;
        ca.mood = 'calm';
        cb.mood = 'calm';
        text = m(l, 'god.peace', { a: an, b: cname(b, l) });
        feedKind = 'peace';
        pushFx({ a, b, color: '#34d399' });
        playSfx('chime');
      }

      const feed: FeedEvent[] = [
        { id: uid(), turn: s.turn, year: s.year, kind: feedKind, text, continents: b ? [a, b] : [a], major: true },
        ...s.feed,
      ].slice(0, 120);
      const timeline = [
        ...s.timeline,
        {
          id: uid(),
          turn: s.turn,
          year: s.year,
          title: tt['god.title'],
          description: text,
          continents: b ? [a, b] : [a],
          kind: 'event' as FeedKind,
        },
      ].slice(-60);

      stateRef.current = { ...s, continents, feed, timeline };

      const GOD_LABELS: Record<GodAction, 'god.sanction' | 'god.aid' | 'god.provoke' | 'god.peace'> = {
        sanction: 'god.sanction',
        aid: 'god.aid',
        provoke: 'god.provoke',
        imposePeace: 'god.peace',
      };
      const newsEv: CinematicEvent = {
        id: uid(),
        kind: 'god',
        a,
        b,
        title: tt[GOD_LABELS[kind]],
        text,
        major: true,
      };
      resumeRef.current = runningRef.current;
      if (runningRef.current) setRunning(false);
      setNews([newsEv]);
      render();
    },
    [render, pushFx],
  );

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-3 pb-28 pt-4">
      {/* header */}
      <header className="mb-3 flex items-center gap-2.5 px-1">
        <span className="text-3xl">🌍</span>
        <div>
          <h1 className="text-[18px] font-extrabold leading-tight text-white">
            {t['app.title']}
            <span className="block text-[12px] font-medium text-white/70">{t['app.subtitle']}</span>
          </h1>
        </div>
      </header>

      <div className="mb-3">
        <Controls
          state={state}
          running={running}
          speedMs={speedMs}
          thinking={thinking}
          muted={muted}
          onToggleRun={toggleRun}
          onSpeed={setSpeedMs}
          onAiMode={setAiMode}
          onStep={() => void doTurn()}
          onNew={handleNew}
          onToggleMute={toggleMute}
          onGod={() => setGodOpen(true)}
          saves={saves}
          onSave={(name) => setSaves(saveGame(name, stateRef.current))}
          onLoad={(name) => {
            const loaded = loadSave(name);
            if (loaded) {
              setRunning(false);
              stateRef.current = guardSave(loaded);
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
          <ZoomMap
            continents={state.continents}
            selected={state.selectedContinent}
            onSelect={(id) => {
              stateRef.current = { ...stateRef.current, selectedContinent: id };
              render();
            }}
            lang={lang}
            t={t}
            turn={state.turn}
            feed={state.feed}
            fx={fx}
          />
          <Dashboard continent={selected} lang={lang} t={t} />
        </div>
      )}
      {tab === 'feed' && <EventFeed feed={state.feed} lang={lang} t={t} />}
      {tab === 'stats' && <Dashboard continent={selected} lang={lang} t={t} />}
      {tab === 'ranks' && <Rankings continents={state.continents} onSelect={selectContinent} lang={lang} t={t} />}
      {tab === 'time' && <Timeline entries={state.timeline} lang={lang} t={t} onTimelapse={() => setTimelapseOpen(true)} />}
      {tab === 'diplo' && (
        <DiplomacyPanel
          continents={state.continents}
          organizations={state.organizations}
          treaties={state.treaties}
          lang={lang}
          t={t}
        />
      )}

      <footer className="mt-6 text-center text-[11px] text-white/70">
        {t['footer']} · v4.0
      </footer>

      <BottomNav tab={tab} onTab={setTab} t={t} />

      {/* v4 overlays */}
      {news.length > 0 && <BreakingNews events={news} lang={lang} t={t} onDone={handleNewsDone} />}
      {godOpen && (
        <GodPanel lang={lang} t={t} onIntervene={intervene} onClose={() => setGodOpen(false)} />
      )}
      {timelapseOpen && (
        <Timelapse history={state.history} lang={lang} t={t} onClose={() => setTimelapseOpen(false)} />
      )}
    </div>
  );
}
