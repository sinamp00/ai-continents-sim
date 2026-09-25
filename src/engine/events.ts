/**
 * Random global events. Each turn there is a chance that the world itself
 * intervenes — pandemics, booms, disasters, breakthroughs. Effects are
 * applied by the simulation; text is bilingual flavor for the feed/timeline.
 */
import type { Continent, ContinentId, FeedEvent } from './types';
import { CONTINENT_IDS, clamp100 } from './types';
import { m } from './messages';
import { cname, type Lang } from '../i18n';

export interface WorldEvent {
  key: string;
  major: boolean;
  /** Apply stat deltas; returns a human-readable impact line. */
  apply: (
    continents: Record<ContinentId, Continent>,
    turn: number,
    year: number,
    lang: Lang,
  ) => { text: string; affected: ContinentId[] };
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const each = (fn: (c: Continent) => void, continents: Record<ContinentId, Continent>) =>
  CONTINENT_IDS.forEach((id) => fn(continents[id]));

let feedSeq = 0;
export function makeFeedEvent(
  turn: number,
  year: number,
  kind: FeedEvent['kind'],
  text: string,
  continents: ContinentId[],
  major: boolean,
): FeedEvent {
  return { id: `e${turn}-${feedSeq++}`, turn, year, kind, text, continents, major };
}

const EVENTS: WorldEvent[] = [
  {
    key: 'ev.pandemic',
    major: true,
    apply: (continents, _t, _y, lang) => {
      each((c) => {
        const hit = rnd(4, 12);
        c.stats.happiness = clamp100(c.stats.happiness - hit);
        c.stats.economy = clamp100(c.stats.economy - hit * 0.7);
        c.stats.population *= 1 - hit / 4000;
      }, continents);
      return { text: m(lang, 'ev.pandemic'), affected: [...CONTINENT_IDS] };
    },
  },
  {
    key: 'ev.golden',
    major: false,
    apply: (continents, _t, _y, lang) => {
      each((c) => {
        c.stats.economy = clamp100(c.stats.economy + rnd(4, 9));
        c.stats.happiness = clamp100(c.stats.happiness + rnd(2, 6));
      }, continents);
      return { text: m(lang, 'ev.golden'), affected: [...CONTINENT_IDS] };
    },
  },
  {
    key: 'ev.volcano',
    major: true,
    apply: (continents, _t, _y, lang) => {
      const victim = pick(CONTINENT_IDS.filter((id) => id !== 'antarctica'));
      const c = continents[victim];
      c.stats.economy = clamp100(c.stats.economy - rnd(8, 14));
      c.stats.happiness = clamp100(c.stats.happiness - rnd(6, 12));
      c.stats.resources = clamp100(c.stats.resources + rnd(2, 6));
      return { text: m(lang, 'ev.volcano', { c: cname(victim, lang) }), affected: [victim] };
    },
  },
  {
    key: 'ev.breakthrough',
    major: false,
    apply: (continents, _t, _y, lang) => {
      const lucky = pick([...CONTINENT_IDS]);
      const c = continents[lucky];
      c.stats.technology = clamp100(c.stats.technology + rnd(6, 12));
      c.stats.economy = clamp100(c.stats.economy + rnd(2, 5));
      return { text: m(lang, 'ev.breakthrough', { c: cname(lucky, lang) }), affected: [lucky] };
    },
  },
  {
    key: 'ev.peace',
    major: false,
    apply: (continents, _t, _y, lang) => {
      each((c) => {
        c.stats.happiness = clamp100(c.stats.happiness + rnd(3, 7));
        CONTINENT_IDS.forEach((o) => {
          if (o !== c.id && c.relations[o] < 0) c.relations[o] = Math.min(0, c.relations[o] + rnd(4, 10));
        });
      }, continents);
      return { text: m(lang, 'ev.peace'), affected: [...CONTINENT_IDS] };
    },
  },
  {
    key: 'ev.resource',
    major: false,
    apply: (continents, _t, _y, lang) => {
      const lucky = pick([...CONTINENT_IDS]);
      const c = continents[lucky];
      c.stats.resources = clamp100(c.stats.resources + rnd(8, 15));
      return { text: m(lang, 'ev.resource', { c: cname(lucky, lang) }), affected: [lucky] };
    },
  },
  {
    key: 'ev.climate',
    major: true,
    apply: (continents, _t, _y, lang) => {
      each((c) => {
        c.stats.economy = clamp100(c.stats.economy - rnd(3, 8));
        c.stats.happiness = clamp100(c.stats.happiness - rnd(3, 7));
      }, continents);
      return { text: m(lang, 'ev.climate'), affected: [...CONTINENT_IDS] };
    },
  },
  {
    key: 'ev.longevity',
    major: false,
    apply: (continents, _t, _y, lang) => {
      each((c) => {
        c.stats.population *= 1 + rnd(0.004, 0.012);
        c.stats.happiness = clamp100(c.stats.happiness + rnd(2, 5));
      }, continents);
      return { text: m(lang, 'ev.longevity'), affected: [...CONTINENT_IDS] };
    },
  },
  {
    key: 'ev.cyber',
    major: false,
    apply: (continents, _t, _y, lang) => {
      each((c) => {
        const dmg = rnd(2, 7) * (c.stats.technology / 80);
        c.stats.economy = clamp100(c.stats.economy - dmg);
        c.stats.technology = clamp100(c.stats.technology - dmg * 0.4);
      }, continents);
      return { text: m(lang, 'ev.cyber'), affected: [...CONTINENT_IDS] };
    },
  },
  {
    key: 'ev.renaissance',
    major: false,
    apply: (continents, _t, _y, lang) => {
      each((c) => {
        c.stats.happiness = clamp100(c.stats.happiness + rnd(4, 9));
      }, continents);
      return { text: m(lang, 'ev.renaissance'), affected: [...CONTINENT_IDS] };
    },
  },
];

/** Maybe trigger a random world event this turn (35% chance). */
export function maybeWorldEvent(
  continents: Record<ContinentId, Continent>,
  turn: number,
  year: number,
  lang: Lang,
): { event: FeedEvent; affected: ContinentId[]; major: boolean } | null {
  if (Math.random() > 0.35) return null;
  const def = pick(EVENTS);
  const result = def.apply(continents, turn, year, lang);
  const event = makeFeedEvent(turn, year, 'event', result.text, result.affected, def.major);
  return { event, affected: result.affected, major: def.major };
}
