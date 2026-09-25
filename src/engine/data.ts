/**
 * Initial world state: the 7 continent civilizations.
 * Stats are plausible, game-flavored approximations — not real-world data.
 */
import type { Continent, ContinentId } from './types';

function rel(
  asia = 0,
  europe = 0,
  africa = 0,
  north_america = 0,
  south_america = 0,
  oceania = 0,
  antarctica = 0,
): Record<ContinentId, number> {
  return { asia, europe, africa, north_america, south_america, oceania, antarctica };
}

export function createInitialContinents(): Record<ContinentId, Continent> {
  return {
    asia: {
      id: 'asia',
      name: 'Asia',
      flag: '🌏',
      color: '#ef4444',
      stats: { population: 4700, economy: 78, resources: 70, technology: 74, military: 76, happiness: 62 },
      government: 'technocracy',
      personality:
        'Pragmatic and ambitious. Values economic growth and technological dominance. Prefers trade and influence over open war, but will flex military power when provoked. Speaks in measured, strategic terms.',
      traits: { aggression: 0.45, cooperation: 0.6, ambition: 0.9 },
      relations: rel(0, 10, 25, -15, 20, 15, 30),
      alliances: [],
      atWarWith: [],
      organizations: [],
      statement: 'Asia seeks prosperity through innovation and open markets.',
    },
    europe: {
      id: 'europe',
      name: 'Europe',
      flag: '🌍',
      color: '#3b82f6',
      stats: { population: 745, economy: 88, resources: 52, technology: 90, military: 60, happiness: 74 },
      government: 'democracy',
      personality:
        'Diplomatic and principled. Champions alliances, treaties and international organizations. Prefers negotiation over conflict and shares technology with trusted partners. Speaks like a seasoned diplomat.',
      traits: { aggression: 0.25, cooperation: 0.9, ambition: 0.6 },
      relations: rel(10, 0, 30, 55, 35, 60, 40),
      alliances: [],
      atWarWith: [],
      organizations: [],
      statement: 'Europe believes dialogue builds stronger civilizations than weapons.',
    },
    africa: {
      id: 'africa',
      name: 'Africa',
      flag: '🌍',
      color: '#f59e0b',
      stats: { population: 1500, economy: 46, resources: 88, technology: 44, military: 42, happiness: 58 },
      government: 'federation',
      personality:
        'Proud and resource-rich. Demands fair trade for its vast natural wealth. Wary of exploitation, quick to form blocs with fellow developing regions. Passionate, direct speaker.',
      traits: { aggression: 0.4, cooperation: 0.55, ambition: 0.8 },
      relations: rel(25, 30, 0, 5, 45, 20, 25),
      alliances: [],
      atWarWith: [],
      organizations: [],
      statement: 'Africa’s resources will fuel Africa’s rise — on fair terms.',
    },
    north_america: {
      id: 'north_america',
      name: 'North America',
      flag: '🌎',
      color: '#8b5cf6',
      stats: { population: 600, economy: 94, resources: 76, technology: 88, military: 96, happiness: 70 },
      government: 'democracy',
      personality:
        'Confident superpower. Protects its interests and allies with overwhelming strength. Uses economic leverage and military deterrence. Bold, assertive speaker who respects strength in others.',
      traits: { aggression: 0.6, cooperation: 0.5, ambition: 0.85 },
      relations: rel(-15, 55, 5, 0, 30, 65, 35),
      alliances: [],
      atWarWith: [],
      organizations: [],
      statement: 'North America stands ready to defend freedom and its friends.',
    },
    south_america: {
      id: 'south_america',
      name: 'South America',
      flag: '🌎',
      color: '#10b981',
      stats: { population: 440, economy: 56, resources: 82, technology: 56, military: 46, happiness: 68 },
      government: 'democracy',
      personality:
        'Warm and community-driven. Prioritizes happiness and regional solidarity. Avoids wars, loves trade and cultural exchange. Speaks with warmth and optimism.',
      traits: { aggression: 0.2, cooperation: 0.85, ambition: 0.5 },
      relations: rel(20, 35, 45, 30, 0, 30, 30),
      alliances: [],
      atWarWith: [],
      organizations: [],
      statement: 'South America chooses friendship, football and shared prosperity.',
    },
    oceania: {
      id: 'oceania',
      name: 'Oceania',
      flag: '🌏',
      color: '#06b6d4',
      stats: { population: 45, economy: 72, resources: 64, technology: 76, military: 34, happiness: 84 },
      government: 'democracy',
      personality:
        'Small but clever island civilization. Stays neutral, mediates conflicts, punches above its weight in diplomacy and tech. Calm, witty speaker.',
      traits: { aggression: 0.15, cooperation: 0.95, ambition: 0.55 },
      relations: rel(15, 60, 20, 65, 30, 0, 45),
      alliances: [],
      atWarWith: [],
      organizations: [],
      statement: 'Oceania keeps the peace and keeps the surf up.',
    },
    antarctica: {
      id: 'antarctica',
      name: 'Antarctica',
      flag: '🧊',
      color: '#94a3b8',
      stats: { population: 0.01, economy: 22, resources: 95, technology: 68, military: 8, happiness: 72 },
      government: 'commune',
      personality:
        'Mysterious council of research stations sitting on untapped riches. Rarely acts, but when it does the world listens. Speaks cryptically about science and the future.',
      traits: { aggression: 0.1, cooperation: 0.5, ambition: 0.4 },
      relations: rel(30, 40, 25, 35, 30, 45, 0),
      alliances: [],
      atWarWith: [],
      organizations: [],
      statement: 'Antarctica watches. Antarctica researches. Antarctica waits.',
    },
  };
}
