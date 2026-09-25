/**
 * LLM Brain — each continent agent makes its REAL decisions through a live
 * large language model (free API, no key required), not hardcoded logic.
 *
 * One batched call per turn: the model roleplays all 7 continents
 * independently and returns one decision + one public diplomatic statement
 * per continent as strict JSON. If the API is unreachable, the caller falls
 * back to the offline heuristic brain (localBrain.ts).
 */
import type {
  ActionType,
  AgentDecision,
  Continent,
  ContinentId,
  GameState,
} from './types';
import { CONTINENT_IDS } from './types';
import { m } from './messages';
import { cname, type Lang } from '../i18n';

const API_BASE = 'https://text.pollinations.ai';
/** Free, keyless model route on Pollinations. */
const MODEL = 'openai';

const VALID_ACTIONS: ActionType[] = [
  'trade',
  'alliance',
  'war',
  'peace',
  'tech_share',
  'treaty',
  'change_government',
  'found_organization',
  'none',
];

function shortStats(c: Continent): string {
  const s = c.stats;
  return (
    `eco${Math.round(s.economy)} res${Math.round(s.resources)} ` +
    `tech${Math.round(s.technology)} mil${Math.round(s.military)} hap${Math.round(s.happiness)}`
  );
}

/** Compact world snapshot so the prompt stays small and fast on mobile. */
function buildWorldSummary(state: GameState): string {
  const lines: string[] = [];
  for (const id of CONTINENT_IDS) {
    const c = state.continents[id];
    const notableRels = CONTINENT_IDS.filter((o) => o !== id)
      .map((o) => {
        const r = c.relations[o];
        if (r <= -40 || r >= 60) return `${state.continents[o].name}:${r}`;
        return null;
      })
      .filter(Boolean)
      .join(' ');
    const status: string[] = [];
    if (c.alliances.length) status.push(`allied:[${c.alliances.map((a) => state.continents[a].name).join(',')}]`);
    if (c.atWarWith.length) status.push(`WAR:[${c.atWarWith.map((a) => state.continents[a].name).join(',')}]`);
    if (c.organizations.length) status.push(`orgs:${c.organizations.length}`);
    lines.push(
      `- ${c.name} (${c.government}) [${shortStats(c)}] ${notableRels ? `rel{${notableRels}}` : ''} ${status.join(' ')} | trait: ${c.personality.split('.')[0]}`,
    );
  }
  const recent = state.timeline.slice(-3).map((t) => `${t.year}: ${t.title}`).join(' | ');
  return lines.join('\n') + (recent ? `\nRecent history: ${recent}` : '');
}

function buildPrompt(state: GameState, lang: Lang): string {
  const langRule =
    lang === 'fa'
      ? `\nLANGUAGE: Write "reasoning" and "statement" in Persian (Farsi). Refer to continents by their Persian names: آسیا، اروپا، آفریقا، آمریکای شمالی، آمریکای جنوبی، اقیانوسیه، قطب جنوب. Treaty/organization "detail" titles should also be in Persian.`
      : `\nLANGUAGE: Write "reasoning" and "statement" in English.`;
  return `You are the decision engine of a civilization simulation. Roleplay EACH of the 7 continent civilizations below as an independent AI agent with its own personality and interests. Each agent chooses exactly ONE action for year ${state.year} (turn ${state.turn}).
${langRule}

WORLD STATE:
${buildWorldSummary(state)}

RULES:
- war: only if relations are very hostile AND you believe you can win; wars are costly.
- peace: only meaningful if currently at war with the target.
- alliance: needs decent relations; you cannot ally someone you are at war with.
- trade / tech_share: improve both sides; best with neutral-to-friendly targets.
- treaty: formal pact with a target (give it a short title in "detail").
- change_government: put the NEW government type in "detail" (one of: democracy, autocracy, technocracy, theocracy, federation, monarchy, commune, anarchy). Use when happiness is low or strategy shifts.
- found_organization: put the organization NAME in "detail" and a one-line purpose in "reasoning".
- none: do nothing this turn.
- "target" must be another continent (omit for change_government / found_organization / none).
- "reasoning": ONE short public sentence explaining the decision (no internal monologue).
- "statement": ONE short in-character public diplomatic message (max 20 words).

Reply with ONLY a JSON array of 7 objects, no other text:
[{"continent":"asia","action":"trade","target":"europe","reasoning":"...","statement":"..."}, ...]
Continent ids: asia, europe, africa, north_america, south_america, oceania, antarctica.`;
}

/** Extract the first JSON array from a model reply (tolerates wrappers). */
function extractJsonArray(text: string): unknown {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) throw new Error('No JSON array in reply');
  return JSON.parse(text.slice(start, end + 1));
}

interface RawDecision {
  continent?: unknown;
  action?: unknown;
  target?: unknown;
  detail?: unknown;
  reasoning?: unknown;
  statement?: unknown;
}

/** Validate + sanitize one raw decision; returns null if unusable. */
function sanitize(raw: RawDecision, state: GameState, lang: Lang): AgentDecision | null {
  const continent = raw.continent as ContinentId;
  if (!CONTINENT_IDS.includes(continent)) return null;
  const c = state.continents[continent];

  let action = raw.action as ActionType;
  if (!VALID_ACTIONS.includes(action)) action = 'none';

  let target = raw.target as ContinentId | undefined;
  if (target && !CONTINENT_IDS.includes(target)) target = undefined;
  if (target === continent) target = undefined;

  // Rule out nonsensical actions so one bad reply can't corrupt the world.
  if (action === 'peace' && (!target || !c.atWarWith.includes(target))) action = 'none';
  if (action === 'war' && (!target || c.atWarWith.includes(target))) action = 'none';
  if (action === 'alliance' && (!target || c.alliances.includes(target) || c.atWarWith.includes(target))) action = 'none';
  if ((action === 'trade' || action === 'tech_share' || action === 'treaty') && !target) action = 'none';

  const reasoning =
    typeof raw.reasoning === 'string' && raw.reasoning.trim()
      ? raw.reasoning.trim().slice(0, 160)
      : m(lang, 'llm.reason');
  const statement =
    typeof raw.statement === 'string' && raw.statement.trim()
      ? raw.statement.trim().slice(0, 140)
      : m(lang, 'llm.watch', { a: cname(continent, lang) });
  const detail = typeof raw.detail === 'string' ? raw.detail.slice(0, 80) : undefined;

  return { continent, action, target, detail, reasoning, statement };
}

/**
 * Ask the LLM for this turn's decisions.
 * Throws on any failure — the caller must fall back to the local brain.
 */
export async function fetchLlmDecisions(state: GameState, lang: Lang = 'fa'): Promise<AgentDecision[]> {
  const prompt = buildPrompt(state, lang);
  const url = `${API_BASE}/${encodeURIComponent(prompt)}?model=${MODEL}`;

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 45000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
    const text = await res.text();
    const parsed = extractJsonArray(text);
    if (!Array.isArray(parsed)) throw new Error('Reply is not an array');

    const decisions: AgentDecision[] = [];
    const seen = new Set<ContinentId>();
    for (const raw of parsed as RawDecision[]) {
      const d = sanitize(raw, state, lang);
      if (d && !seen.has(d.continent)) {
        seen.add(d.continent);
        decisions.push(d);
      }
    }
    // Every continent must decide; fill gaps with 'none'.
    for (const id of CONTINENT_IDS) {
      if (!seen.has(id)) {
        decisions.push({
          continent: id,
          action: 'none',
          reasoning: m(lang, 'llm.silence'),
          statement: state.continents[id].statement,
        });
      }
    }
    return decisions;
  } finally {
    clearTimeout(timeout);
  }
}
