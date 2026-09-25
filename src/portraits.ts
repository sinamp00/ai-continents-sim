/**
 * AI-painted character portraits (public/portraits/*.webp).
 * Falls back to the emoji avatar if an image is missing.
 */
import type { ContinentId } from './engine/types';

const base = import.meta.env.BASE_URL;

export const PORTRAITS: Record<ContinentId, string> = {
  asia: `${base}portraits/asia.webp`,
  europe: `${base}portraits/europe.webp`,
  africa: `${base}portraits/africa.webp`,
  north_america: `${base}portraits/north_america.webp`,
  south_america: `${base}portraits/south_america.webp`,
  oceania: `${base}portraits/oceania.webp`,
  antarctica: `${base}portraits/antarctica.webp`,
};
