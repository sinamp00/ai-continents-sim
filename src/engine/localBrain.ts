/**
 * Local Brain — offline fallback decision maker.
 * Used automatically when the LLM API is unreachable. Each continent scores
 * candidate actions with a utility function built from its personality
 * traits + current world state + randomness, so outcomes are never
 * hardcoded; two identical runs still diverge.
 * All public text is bilingual (Persian/English).
 */
import type { AgentDecision, Continent, ContinentId, GameState } from './types';
import { CONTINENT_IDS, GOVERNMENTS } from './types';
import { m, pickSay } from './messages';
import { cname, govName, type Lang } from '../i18n';

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

interface Candidate {
  decision: AgentDecision;
  score: number;
}

function base(c: Continent, action: AgentDecision['action'], target?: ContinentId, detail?: string, reasoning?: string): AgentDecision {
  return {
    continent: c.id,
    action,
    target,
    detail,
    reasoning: reasoning ?? '…',
    statement: c.statement,
  };
}

function withStatement(d: AgentDecision, lang: Lang): AgentDecision {
  return { ...d, statement: pickSay(lang, `say.${d.action}`) };
}

/** Memory of each continent's previous action (session-scoped) — used to
 *  encourage variety so agents don't repeat the same move every turn. */
const lastAction = {} as Record<ContinentId, AgentDecision['action']>;

/** Score every plausible action for one continent and pick the best. */
function decideFor(c: Continent, state: GameState, lang: Lang): AgentDecision {
  const t = c.traits;
  const s = c.stats;
  const candidates: Candidate[] = [];
  const others = CONTINENT_IDS.filter((o) => o !== c.id);
  const prev = lastAction[c.id];
  const A = cname(c.id, lang);

  /** Variety bonus: trying something new beats repeating last turn's move. */
  const variety = (action: AgentDecision['action']) => (prev === action ? -9 : 7);

  // Doing nothing is always an option, but a boring one.
  candidates.push({ decision: base(c, 'none', undefined, undefined, m(lang, 'reason.quiet')), score: 8 + rnd(0, 6) });

  for (const o of others) {
    const other = state.continents[o];
    const rel = c.relations[o];
    const O = cname(o, lang);

    // Trade: attractive with neutral/friendly, rich partners.
    candidates.push({
      decision: base(c, 'trade', o, undefined, m(lang, 'reason.trade', { o: O })),
      score: t.cooperation * 20 + (rel / 100) * 12 + (other.stats.economy / 100) * 8 + variety('trade') + rnd(0, 10),
    });

    // Tech share: needs tech advantage + friendship.
    if (s.technology > other.stats.technology + 5 && rel > 0) {
      candidates.push({
        decision: base(c, 'tech_share', o, undefined, m(lang, 'reason.tech', { o: O })),
        score: t.cooperation * 18 + (rel / 100) * 10 + variety('tech_share') + rnd(0, 8),
      });
    }

    // Alliance: good relations, not at war, shared interests.
    if (rel >= 30 && !c.alliances.includes(o) && !c.atWarWith.includes(o)) {
      candidates.push({
        decision: base(c, 'alliance', o, undefined, m(lang, 'reason.alliance', { o: O })),
        score: t.cooperation * 18 + (rel / 100) * 16 + variety('alliance') + rnd(0, 10),
      });
    }

    // War: hostile relations + military edge + aggression.
    if (rel <= -25 && !c.atWarWith.includes(o) && s.military > other.stats.military * 0.85) {
      candidates.push({
        decision: base(c, 'war', o, undefined, m(lang, 'reason.war', { o: O })),
        score: t.aggression * 26 + (-rel / 100) * 14 + ((s.military - other.stats.military) / 100) * 12 + variety('war') + rnd(0, 8),
      });
    }

    // Peace: only when at war; war fatigue grows with low happiness.
    if (c.atWarWith.includes(o)) {
      candidates.push({
        decision: base(c, 'peace', o, undefined, m(lang, 'reason.peace', { o: O })),
        score: 16 + ((100 - s.happiness) / 100) * 18 + rnd(0, 8),
      });
    }

    // Treaty: mid relations, cooperative.
    if (rel > -20 && rel < 60) {
      candidates.push({
        decision: base(c, 'treaty', o, `${A}–${O}`, m(lang, 'reason.treaty', { a: A, o: O })),
        score: t.cooperation * 20 + variety('treaty') + rnd(0, 10),
      });
    }
  }

  // Government change: desperation move when happiness collapses, or ambition.
  if (s.happiness < 38 || (t.ambition > 0.8 && Math.random() < 0.06)) {
    const current = c.government;
    const options = GOVERNMENTS.filter((g) => g !== current);
    const next = pick(options);
    candidates.push({
      decision: base(c, 'change_government', undefined, next, m(lang, 'reason.gov', { a: A, g: govName(next, lang) })),
      score: ((100 - s.happiness) / 100) * 26 + rnd(0, 8),
    });
  }

  // Found organization: cooperative + has allies, and few orgs exist.
  if (t.cooperation > 0.6 && c.alliances.length >= 1 && state.organizations.length < 5 && Math.random() < 0.25) {
    candidates.push({
      decision: base(c, 'found_organization', undefined, m(lang, 'org.default', { a: A }), m(lang, 'reason.org', { a: A })),
      score: t.cooperation * 16 + rnd(0, 8),
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  const winner = withStatement(candidates[0].decision, lang);
  lastAction[c.id] = winner.action;
  return winner;
}

export function decideLocally(state: GameState, lang: Lang = 'fa'): AgentDecision[] {
  return CONTINENT_IDS.map((id) => decideFor(state.continents[id], state, lang));
}
