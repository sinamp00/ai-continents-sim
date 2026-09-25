/**
 * Turn engine — applies agent decisions, resolves wars, ticks economies,
 * drifts diplomacy and writes the public record (feed + timeline).
 *
 * Nothing here is hardcoded narrative: every outcome emerges from agent
 * decisions + world state + randomness. All narrative text is bilingual
 * (Persian/English) via engine/messages.ts.
 */
import type {
  ActionType,
  AgentDecision,
  Continent,
  ContinentId,
  FeedEvent,
  GameState,
  MoodId,
  Organization,
  TimelineEntry,
  Treaty,
} from './types';
import { CONTINENT_IDS, clamp100, clampRel } from './types';
import { createInitialContinents } from './data';
import { makeFeedEvent, maybeWorldEvent } from './events';
import { m, names } from './messages';
import { cname, govName, INITIAL_STATEMENTS, type Lang } from '../i18n';

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

let idSeq = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${idSeq++}`;

export function createInitialState(lang: Lang = 'fa'): GameState {
  const continents = createInitialContinents();
  // Bilingual opening statements for the dashboard/diplomacy views.
  for (const id of CONTINENT_IDS) {
    continents[id].statement = INITIAL_STATEMENTS[id][lang];
    continents[id].activity = m(lang, 'act.none');
    continents[id].thought = m(lang, 'init.thought');
    continents[id].mood = 'calm';
  }
  return {
    turn: 1,
    year: 2026,
    continents,
    feed: [
      makeFeedEvent(1, 2026, 'info', m(lang, 'init.feed'), [...CONTINENT_IDS], true),
    ],
    timeline: [
      {
        id: uid('t'),
        turn: 1,
        year: 2026,
        title: m(lang, 'init.title'),
        description: m(lang, 'init.desc'),
        continents: [...CONTINENT_IDS],
        kind: 'info',
      },
    ],
    organizations: [],
    treaties: [],
    aiMode: 'llm',
    llmStatus: 'ok',
    selectedContinent: 'asia',
    lastDecisions: [],
  };
}

/** Deep-clone the mutable parts of the state for the next turn. */
function cloneContinents(src: Record<ContinentId, Continent>): Record<ContinentId, Continent> {
  const out = {} as Record<ContinentId, Continent>;
  for (const id of CONTINENT_IDS) {
    const c = src[id];
    out[id] = {
      ...c,
      stats: { ...c.stats },
      relations: { ...c.relations },
      alliances: [...c.alliances],
      atWarWith: [...c.atWarWith],
      organizations: [...c.organizations],
    };
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Decision application                                                */
/* ------------------------------------------------------------------ */

interface TurnLog {
  feed: FeedEvent[];
  timeline: TimelineEntry[];
  organizations: Organization[];
  treaties: Treaty[];
}

function pushMajor(
  log: TurnLog,
  turn: number,
  year: number,
  kind: FeedEvent['kind'],
  title: string,
  description: string,
  continents: ContinentId[],
) {
  const id = uid('t');
  log.timeline.push({ id, turn, year, title, description, continents, kind });
  const star = '⭐';
  log.feed.push({ id: uid('e'), turn, year, kind, text: `${star} ${title} — ${description}`, continents, major: true });
}

function pushFeed(
  log: TurnLog,
  turn: number,
  year: number,
  kind: FeedEvent['kind'],
  text: string,
  continents: ContinentId[],
  major = false,
) {
  const e = makeFeedEvent(turn, year, kind, text, continents, major);
  log.feed.push(e);
  if (major) {
    log.timeline.push({ id: uid('t'), turn, year, title: text.slice(0, 60), description: text, continents, kind });
  }
}

function applyDecision(
  state: GameState,
  continents: Record<ContinentId, Continent>,
  log: TurnLog,
  d: AgentDecision,
  lang: Lang,
) {
  const c = continents[d.continent];
  const t = d.target ? continents[d.target] : null;
  const { turn, year } = state;
  const A = cname(c.id, lang);
  const B = t ? cname(t.id, lang) : '';

  // Every agent's public reasoning is shown — transparency, not hidden CoT.
  if (d.action !== 'none') {
    pushFeed(log, turn, year, 'info', m(lang, 'thought', { a: A, r: d.reasoning }), [c.id]);
  }
  if (d.statement && d.action !== 'none') {
    c.statement = d.statement;
  }

  // The character's inner life: what they're doing + thinking (cinematic scene view).
  if (d.reasoning) c.thought = d.reasoning;
  const simpleActs: ActionType[] = ['trade', 'alliance', 'war', 'peace', 'tech_share'];
  if (d.action === 'none') {
    c.activity = m(lang, 'act.none');
  } else if (simpleActs.includes(d.action)) {
    c.activity = m(lang, `act.${d.action}`, { b: B });
  }
  // treaty / change_government / found_organization set their activity
  // inside their case, once the name is known.

  const bump = (a: Continent, b: Continent, n: number) => {
    a.relations[b.id] = clampRel(a.relations[b.id] + n);
    b.relations[a.id] = clampRel(b.relations[a.id] + n);
  };

  switch (d.action as ActionType) {
    case 'trade': {
      if (!t) break;
      const gain = rnd(2, 6);
      c.stats.economy = clamp100(c.stats.economy + gain);
      t.stats.economy = clamp100(t.stats.economy + gain * rnd(0.7, 1));
      c.stats.happiness = clamp100(c.stats.happiness + rnd(0, 2));
      t.stats.happiness = clamp100(t.stats.happiness + rnd(0, 2));
      bump(c, t, rnd(4, 10));
      pushFeed(log, turn, year, 'trade', m(lang, 'trade', { a: A, b: B }), [c.id, t.id]);
      break;
    }
    case 'tech_share': {
      if (!t) break;
      const transfer = Math.min(rnd(3, 8), Math.max(0, c.stats.technology - t.stats.technology) / 2 + 2);
      t.stats.technology = clamp100(t.stats.technology + transfer);
      c.stats.economy = clamp100(c.stats.economy - rnd(0, 2));
      bump(c, t, rnd(5, 12));
      pushFeed(log, turn, year, 'tech', m(lang, 'tech', { a: A, b: B, n: transfer.toFixed(0) }), [c.id, t.id]);
      break;
    }
    case 'alliance': {
      if (!t) break;
      c.alliances.push(t.id);
      t.alliances.push(c.id);
      bump(c, t, rnd(15, 25));
      c.stats.military = clamp100(c.stats.military + rnd(1, 3));
      t.stats.military = clamp100(t.stats.military + rnd(1, 3));
      pushMajor(log, turn, year, 'alliance', m(lang, 'alliance.title'), m(lang, 'alliance.desc', { a: A, b: B }), [c.id, t.id]);
      break;
    }
    case 'war': {
      if (!t) break;
      c.atWarWith.push(t.id);
      t.atWarWith.push(c.id);
      // Break alliances between the two if any.
      c.alliances = c.alliances.filter((a) => a !== t.id);
      t.alliances = t.alliances.filter((a) => a !== c.id);
      c.relations[t.id] = -100;
      t.relations[c.id] = -100;
      c.stats.happiness = clamp100(c.stats.happiness - rnd(4, 9));
      t.stats.happiness = clamp100(t.stats.happiness - rnd(4, 9));
      pushMajor(log, turn, year, 'war', m(lang, 'war.title'), m(lang, 'war.desc', { a: A, b: B }), [c.id, t.id]);
      break;
    }
    case 'peace': {
      if (!t) break;
      c.atWarWith = c.atWarWith.filter((a) => a !== t.id);
      t.atWarWith = t.atWarWith.filter((a) => a !== c.id);
      bump(c, t, rnd(25, 40));
      c.stats.happiness = clamp100(c.stats.happiness + rnd(3, 7));
      t.stats.happiness = clamp100(t.stats.happiness + rnd(3, 7));
      pushMajor(log, turn, year, 'peace', m(lang, 'peace.title'), m(lang, 'peace.desc', { a: A, b: B }), [c.id, t.id]);
      break;
    }
    case 'treaty': {
      if (!t) break;
      const treaty: Treaty = {
        id: uid('tr'),
        title: d.detail || m(lang, 'treaty.default', { a: cname(c.id, lang), b: cname(t.id, lang) }),
        parties: [c.id, t.id],
        turn,
        year,
      };
      log.treaties.push(treaty);
      bump(c, t, rnd(8, 16));
      c.stats.happiness = clamp100(c.stats.happiness + rnd(1, 3));
      t.stats.happiness = clamp100(t.stats.happiness + rnd(1, 3));
      pushFeed(log, turn, year, 'treaty', m(lang, 'treaty', { t: treaty.title, a: A, b: B }), [c.id, t.id], true);
      log.timeline.push({
        id: uid('t'),
        turn,
        year,
        title: m(lang, 'treaty.title', { t: treaty.title }),
        description: names([c.id, t.id], lang),
        continents: [c.id, t.id],
        kind: 'treaty',
      });
      c.activity = m(lang, 'act.treaty', { n: treaty.title, b: B });
      break;
    }
    case 'change_government': {
      const valid = ['democracy', 'autocracy', 'technocracy', 'theocracy', 'federation', 'monarchy', 'commune', 'anarchy'] as const;
      const next = valid.includes(d.detail as (typeof valid)[number])
        ? (d.detail as Continent['government'])
        : pick([...valid]);
      const old = c.government;
      c.government = next;
      // Transition turmoil, then relief.
      c.stats.happiness = clamp100(c.stats.happiness + rnd(-6, 8));
      c.stats.economy = clamp100(c.stats.economy + rnd(-3, 3));
      pushMajor(
        log, turn, year, 'government',
        m(lang, 'gov.title', { a: A }),
        m(lang, 'gov.desc', { a: A, old: govName(old, lang), new: govName(next, lang) }),
        [c.id],
      );
      c.activity = m(lang, 'act.change_government', { g: govName(next, lang) });
      break;
    }
    case 'found_organization': {
      const members = [c.id, ...c.alliances.filter((a) => !continents[a].organizations.includes('__x'))];
      const org: Organization = {
        id: uid('org'),
        name: d.detail || m(lang, 'org.default', { a: cname(c.id, lang) }),
        founder: c.id,
        members: [...new Set(members)],
        foundedTurn: turn,
        foundedYear: year,
        purpose: d.reasoning,
      };
      log.organizations.push(org);
      org.members.forEach((mbr) => {
        if (!continents[mbr].organizations.includes(org.id)) continents[mbr].organizations.push(org.id);
      });
      // Members drift closer diplomatically.
      for (let i = 0; i < org.members.length; i++) {
        for (let j = i + 1; j < org.members.length; j++) {
          const a = continents[org.members[i]];
          const b = continents[org.members[j]];
          a.relations[b.id] = clampRel(a.relations[b.id] + rnd(4, 10));
          b.relations[a.id] = clampRel(b.relations[a.id] + rnd(4, 10));
        }
      }
      pushMajor(
        log, turn, year, 'organization',
        m(lang, 'org.title'),
        m(lang, 'org.desc', { a: A, n: org.name, c: org.members.length }),
        org.members,
      );
      c.activity = m(lang, 'act.found_organization', { n: org.name });
      break;
    }
    case 'none':
    default:
      break;
  }
}

/* ------------------------------------------------------------------ */
/* War resolution — each active war pair clashes once per turn          */
/* ------------------------------------------------------------------ */

function resolveWars(
  continents: Record<ContinentId, Continent>,
  log: TurnLog,
  turn: number,
  year: number,
  lang: Lang,
) {
  const seen = new Set<string>();
  for (const id of CONTINENT_IDS) {
    const c = continents[id];
    for (const enemyId of [...c.atWarWith]) {
      const key = [id, enemyId].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      const e = continents[enemyId];

      // Allies pile in: each ally adds a fraction of its military.
      const power = (x: Continent) =>
        x.stats.military + x.alliances.reduce((s, a) => s + continents[a].stats.military * 0.25, 0);
      const pA = power(c) * rnd(0.85, 1.15);
      const pB = power(e) * rnd(0.85, 1.15);

      const dmgA = clamp100((pB / Math.max(1, pA)) * rnd(4, 10));
      const dmgB = clamp100((pA / Math.max(1, pB)) * rnd(4, 10));

      c.stats.military = clamp100(c.stats.military - dmgA);
      e.stats.military = clamp100(e.stats.military - dmgB);
      c.stats.economy = clamp100(c.stats.economy - dmgA * 0.5);
      e.stats.economy = clamp100(e.stats.economy - dmgB * 0.5);
      c.stats.population *= 1 - dmgA / 5000;
      e.stats.population *= 1 - dmgB / 5000;
      c.stats.happiness = clamp100(c.stats.happiness - rnd(1, 4));
      e.stats.happiness = clamp100(e.stats.happiness - rnd(1, 4));

      const winner = pA >= pB ? c : e;
      const loser = pA >= pB ? e : c;
      pushFeed(
        log, turn, year, 'war',
        m(lang, 'battle', {
          a: cname(c.id, lang),
          b: cname(e.id, lang),
          w: cname(winner.id, lang),
          n: Math.round(dmgA + dmgB),
        }),
        [c.id, e.id],
      );

      // Decisive defeat → capitulation: forced peace + reparations.
      if (loser.stats.military < 18 && Math.random() < 0.5) {
        const rep = rnd(4, 10);
        loser.stats.economy = clamp100(loser.stats.economy - rep);
        winner.stats.economy = clamp100(winner.stats.economy + rep * 0.7);
        c.atWarWith = c.atWarWith.filter((a) => a !== e.id);
        e.atWarWith = e.atWarWith.filter((a) => a !== c.id);
        c.relations[e.id] = clampRel(c.relations[e.id] + 30);
        e.relations[c.id] = clampRel(e.relations[c.id] + 30);
        pushMajor(
          log, turn, year, 'peace',
          m(lang, 'capitulate.title', { l: cname(loser.id, lang) }),
          m(lang, 'capitulate.desc', { l: cname(loser.id, lang), w: cname(winner.id, lang) }),
          [c.id, e.id],
        );
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/* Diplomatic incidents — random sparks between pairs of continents      */
/* ------------------------------------------------------------------ */

const INCIDENTS: { key: string; delta: [number, number] }[] = [
  { key: 'inc.trade', delta: [-14, -6] },
  { key: 'inc.spy', delta: [-16, -8] },
  { key: 'inc.culture', delta: [6, 14] },
  { key: 'inc.memo', delta: [5, 12] },
  { key: 'inc.border', delta: [-15, -5] },
  { key: 'inc.research', delta: [6, 13] },
];

function diplomaticIncidents(
  continents: Record<ContinentId, Continent>,
  log: TurnLog,
  turn: number,
  year: number,
  lang: Lang,
) {
  if (Math.random() > 0.45) return;
  const [a, b] = [...CONTINENT_IDS].sort(() => Math.random() - 0.5).slice(0, 2);
  const ca = continents[a];
  const cb = continents[b];
  if (ca.atWarWith.includes(b)) return;
  const incident = pick(INCIDENTS);
  const delta = rnd(incident.delta[0], incident.delta[1]);
  ca.relations[b] = clampRel(ca.relations[b] + delta);
  cb.relations[a] = clampRel(cb.relations[a] + delta);
  pushFeed(
    log, turn, year, delta < 0 ? 'event' : 'info',
    m(lang, incident.key, { a: cname(a, lang), b: cname(b, lang) }),
    [a, b],
  );
}

/* ------------------------------------------------------------------ */
/* Passive world tick                                                  */
/* ------------------------------------------------------------------ */

function worldTick(continents: Record<ContinentId, Continent>) {
  for (const id of CONTINENT_IDS) {
    const c = continents[id];
    const s = c.stats;

    // Economy: resources + tech drive growth; war drags it down.
    const warPenalty = c.atWarWith.length * 2.5;
    s.economy = clamp100(s.economy + (s.resources / 100) * rnd(0.5, 1.5) + (s.technology / 100) * rnd(0.3, 1) - warPenalty * 0.4 + rnd(-1, 1));

    // Slow tech progress, faster for technocracies.
    s.technology = clamp100(s.technology + rnd(0.2, 1) * (c.government === 'technocracy' ? 1.6 : 1));

    // Population growth eases with happiness.
    s.population *= 1 + (s.happiness / 100) * rnd(0.001, 0.004);

    // Happiness drifts toward 55, pushed by economy and dragged by war.
    const target = 55 + (s.economy - 60) * 0.25 - c.atWarWith.length * 8;
    s.happiness = clamp100(s.happiness + (target - s.happiness) * 0.08 + rnd(-1.5, 1.5));

    // Military slowly rebuilds in peacetime.
    if (!c.atWarWith.length) s.military = clamp100(s.military + rnd(0, 1.2));

    // Resources deplete slowly with economic activity.
    s.resources = clamp100(s.resources - (s.economy / 100) * rnd(0.1, 0.5));

    // Relations drift toward neutral; alliances warm, wars stay frozen.
    for (const o of CONTINENT_IDS) {
      if (o === id) continue;
      if (c.atWarWith.includes(o)) {
        c.relations[o] = -100;
        continue;
      }
      const r = c.relations[o];
      const drift = r > 0 ? -rnd(0, 1.2) : r < 0 ? rnd(0, 1.2) : 0;
      const allyBonus = c.alliances.includes(o) ? rnd(0, 1.5) : 0;
      c.relations[o] = clampRel(r + drift + allyBonus);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/** Derive the character's emotional state from their situation. */
function deriveMood(c: Continent): MoodId {
  const s = c.stats;
  if (c.atWarWith.length > 0) {
    return s.military < 35 || s.happiness < 25 ? 'despair' : 'furious';
  }
  if (s.happiness < 25) return 'despair';
  if (s.economy < 30) return 'worried';
  if (s.military > 72 && c.traits.aggression > 0.55) return 'scheming';
  if (c.alliances.length >= 3) return 'confident';
  if (s.happiness > 70) return 'hopeful';
  if (s.technology > 75 || s.economy > 80) return 'triumphant';
  return 'calm';
}

/**
 * Simulate one full turn from agent decisions.
 * Returns the next GameState (immutable update).
 */
export function runTurn(state: GameState, decisions: AgentDecision[], lang: Lang = 'fa'): GameState {
  const continents = cloneContinents(state.continents);
  const log: TurnLog = {
    feed: [],
    timeline: [],
    organizations: [...state.organizations],
    treaties: [...state.treaties],
  };
  const { turn, year } = state;

  // 1. Agents act (in random order so no continent always moves first).
  const shuffled = [...decisions].sort(() => Math.random() - 0.5);
  for (const d of shuffled) applyDecision(state, continents, log, d, lang);

  // 2. Wars resolve.
  resolveWars(continents, log, turn, year, lang);

  // 3. Passive world tick.
  worldTick(continents);

  // 3b. Diplomatic incidents spark or soothe tensions.
  diplomaticIncidents(continents, log, turn, year, lang);

  // 4. Random global event.
  const worldEvent = maybeWorldEvent(continents, turn, year, lang);
  if (worldEvent) {
    log.feed.push(worldEvent.event);
    if (worldEvent.major) {
      log.timeline.push({
        id: uid('t'),
        turn,
        year,
        title: worldEvent.event.text.slice(0, 60),
        description: worldEvent.event.text,
        continents: worldEvent.affected,
        kind: 'event',
      });
    }
  }

  // 4b. Update every character's emotional state from the new situation.
  for (const id of CONTINENT_IDS) continents[id].mood = deriveMood(continents[id]);

  // 5. Assemble next state (cap feed at 300 entries for memory).
  const feed = [...log.feed, ...state.feed].slice(0, 300);
  const timeline = [...state.timeline, ...log.timeline].sort((a, b) => a.turn - b.turn);

  return {
    ...state,
    turn: turn + 1,
    year: year + 1,
    continents,
    feed,
    timeline,
    organizations: log.organizations,
    treaties: log.treaties,
    lastDecisions: decisions,
  };
}
