import { describe, it, expect, beforeEach, afterAll } from "vitest";
import {
  hasEntryMusicPlayed,
  DETECTRIX_MUSIC_PLAYED_KEY,
  DETECTRIX_INTRO_ENTERED_KEY,
} from "@/components/intro/DetectiveCaseIntro";

// Mock in-memory Web Storage for Node.js test environment
class MockStorage implements Storage {
  private store: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.store).length;
  }

  clear(): void {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  key(index: number): string | null {
    return Object.keys(this.store)[index] ?? null;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
}

describe("Intro Page & Entry Music Logic", () => {
  const originalLocalStorage = globalThis.localStorage;
  const originalSessionStorage = globalThis.sessionStorage;
  const originalWindow = globalThis.window;

  beforeEach(() => {
    const mockLocal = new MockStorage();
    const mockSession = new MockStorage();

    Object.defineProperty(globalThis, "localStorage", {
      value: mockLocal,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(globalThis, "sessionStorage", {
      value: mockSession,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(globalThis, "window", {
      value: {
        localStorage: mockLocal,
        sessionStorage: mockSession,
      },
      writable: true,
      configurable: true,
    });
  });

  afterAll(() => {
    Object.defineProperty(globalThis, "localStorage", {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, "sessionStorage", {
      value: originalSessionStorage,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, "window", {
      value: originalWindow,
      writable: true,
      configurable: true,
    });
  });

  it("initially indicates entry music has not been played", () => {
    expect(hasEntryMusicPlayed()).toBe(false);
  });

  it("indicates entry music has been played after entering, and prevents replay", () => {
    // Simulate user entering case and playing entry music
    localStorage.setItem(DETECTRIX_MUSIC_PLAYED_KEY, "true");
    localStorage.setItem(DETECTRIX_INTRO_ENTERED_KEY, "true");

    // Must be true now
    expect(hasEntryMusicPlayed()).toBe(true);

    // Simulating next visit / page refresh: music remains flagged as played
    const storedStatus = localStorage.getItem(DETECTRIX_MUSIC_PLAYED_KEY);
    expect(storedStatus).toBe("true");

    // Guard guarantees music will not replay
    expect(hasEntryMusicPlayed()).toBe(true);
  });

  it("handles sessionStorage fallback seamlessly", () => {
    sessionStorage.setItem(DETECTRIX_MUSIC_PLAYED_KEY, "true");
    expect(hasEntryMusicPlayed()).toBe(true);
  });
});
