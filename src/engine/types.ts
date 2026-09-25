/**
 * Core type definitions for the AI Continents Civilization Simulator.
 * The engine is UI-agnostic: it only produces plain data.
 */

export type ContinentId =
  | 'asia'
  | 'europe'
  | 'africa'
  | 'north_america'
  | 'south_america'
  | 'oceania'
  | 'antarctica';

export const CONTINENT_IDS: ContinentId[] = [
  'asia',
  'europe',
  'africa',
  'north_america',
  'south_america',
  'oceania',
  'antarctica',
];

/** 0–100 index stats (population is in millions, separate scale). */
export interface ContinentStats {
  /** Population in millions */
  population: number;
  economy: number;
  resources: number;
  technology: number;
  military: number;
  happiness: number;
}

export type GovernmentType =
  | 'democracy'
  | 'autocracy'
  | 'technocracy'
  | 'theocracy'
  | 'federation'
  | 'monarchy'
  | 'commune'
  | 'anarchy';

export const GOVERNMENTS: GovernmentType[] = [
  'democracy',
  'autocracy',
  'technocracy',
  'theocracy',
  'federation',
  'monarchy',
  'commune',
  'anarchy',
];

/** The character's emotional state, derived each turn from their situation. */
export type MoodId =
  | 'furious'
  | 'despair'
  | 'worried'
  | 'triumphant'
  | 'confident'
  | 'hopeful'
  | 'scheming'
  | 'calm';

export interface Continent {
  id: ContinentId;
  name: string;
  /** Emoji flag shown in the UI */
  flag: string;
  /** Base map color (hex) */
  color: string;
  stats: ContinentStats;
  government: GovernmentType;
  /** Personality brief fed to the LLM brain */
  personality: string;
  /** Behavioral weights used by the offline fallback brain (0–1) */
  traits: { aggression: number; cooperation: number; ambition: number };
  /** Diplomatic standing toward every other continent (-100 … 100) */
  relations: Record<ContinentId, number>;
  alliances: ContinentId[];
  atWarWith: ContinentId[];
  /** ids of organizations this continent belongs to */
  organizations: string[];
  /** Latest public diplomatic statement (shown in the diplomacy panel) */
  statement: string;
  /** What the character is currently DOING (localized, updated each turn) */
  activity: string;
  /** The character's inner monologue — latest decision reasoning (localized) */
  thought: string;
  /** Current emotional state (localized at render time) */
  mood: MoodId;
}

/** Actions an agent may take on its turn. */
export type ActionType =
  | 'trade'
  | 'alliance'
  | 'war'
  | 'peace'
  | 'tech_share'
  | 'treaty'
  | 'change_government'
  | 'found_organization'
  | 'none';

/**
 * One decision made by one continent agent for the current turn.
 * `reasoning` is a SHORT public summary of why — never internal
 * chain-of-thought. `statement` is the agent's public diplomatic message.
 */
export interface AgentDecision {
  continent: ContinentId;
  action: ActionType;
  target?: ContinentId;
  /** Extra detail: new government, organization name, treaty title… */
  detail?: string;
  reasoning: string;
  statement: string;
}

export type FeedKind =
  | 'war'
  | 'peace'
  | 'alliance'
  | 'trade'
  | 'tech'
  | 'treaty'
  | 'government'
  | 'organization'
  | 'event'
  | 'info';

export interface FeedEvent {
  id: string;
  turn: number;
  year: number;
  kind: FeedKind;
  text: string;
  continents: ContinentId[];
  /** Major events are also recorded on the historical timeline */
  major: boolean;
}

export interface TimelineEntry {
  id: string;
  turn: number;
  year: number;
  title: string;
  description: string;
  continents: ContinentId[];
  kind: FeedKind;
}

/** A dramatic moment worth showing cinematically (breaking news / battle FX). */
export interface CinematicEvent {
  id: string;
  kind: 'war' | 'peace' | 'alliance' | 'organization' | 'treaty' | 'battle' | 'god';
  a: ContinentId;
  b?: ContinentId;
  title: string;
  text: string;
  /** major → breaking-news overlay; minor → map FX only */
  major: boolean;
  /** bigger explosion on the map (fresh wars, god strikes) */
  big?: boolean;
}

/** One lightweight snapshot per turn for the timelapse player. */
export interface HistorySnapshot {
  turn: number;
  year: number;
  powers: Record<ContinentId, number>;
  wars: [ContinentId, ContinentId][];
}

export interface Organization {
  id: string;
  name: string;
  founder: ContinentId;
  members: ContinentId[];
  foundedTurn: number;
  foundedYear: number;
  purpose: string;
}

export interface Treaty {
  id: string;
  title: string;
  parties: ContinentId[];
  turn: number;
  year: number;
}

export type AiMode = 'llm' | 'local';

export interface GameState {
  turn: number;
  year: number;
  continents: Record<ContinentId, Continent>;
  feed: FeedEvent[];
  timeline: TimelineEntry[];
  organizations: Organization[];
  treaties: Treaty[];
  aiMode: AiMode;
  /** 'ok' = LLM answering, 'fallback' = LLM failed, using local brain */
  llmStatus: 'ok' | 'fallback';
  selectedContinent: ContinentId | null;
  /** decisions of the most recently simulated turn (for inspection) */
  lastDecisions: AgentDecision[];
  /** dramatic moments of the most recent turn (reset every turn) */
  cinematic: CinematicEvent[];
  /** per-turn snapshots for the timelapse player */
  history: HistorySnapshot[];
}

export interface SaveSlot {
  name: string;
  savedAt: number;
  turn: number;
  year: number;
  state: GameState;
}

/** Weighted overall power used for rankings. */
export function powerScore(c: Continent): number {
  const s = c.stats;
  return (
    s.economy * 0.25 +
    s.military * 0.25 +
    s.technology * 0.2 +
    s.resources * 0.15 +
    s.happiness * 0.1 +
    Math.min(30, Math.log10(Math.max(1, s.population)) * 10) * 0.05
  );
}

/** Clamp a stat to the 0–100 range. */
export function clamp100(n: number): number {
  return Math.max(0, Math.min(100, n));
}

/** Clamp relations to -100…100. */
export function clampRel(n: number): number {
  return Math.max(-100, Math.min(100, n));
}
