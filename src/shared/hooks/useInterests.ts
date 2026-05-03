import { useState, useCallback } from 'react';

const STORAGE_KEY = 'customer_interests_v1';
const MAX_INTERESTS = 15;

function loadInterests(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveInterests(interests: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(interests));
  } catch {
    // ignore storage errors (e.g. private browsing quota)
  }
}

/**
 * Tracks which product categories the user has shown interest in
 * (by clicking on products, categories, or stores) and persists
 * the list to localStorage so it survives page refreshes.
 */
export function useInterests() {
  const [interests, setInterests] = useState<string[]>(loadInterests);

  const trackInterest = useCallback((category: string) => {
    setInterests(prev => {
      const updated = [category, ...prev.filter(c => c !== category)].slice(
        0,
        MAX_INTERESTS
      );
      saveInterests(updated);
      return updated;
    });
  }, []);

  return { interests, trackInterest };
}









