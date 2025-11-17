/**
 * Tests for useRateLimit Hook
 *
 * RATE-001: Client-side rate limiting tests
 * Phase 3: Production Hardening & Optimization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRateLimit, formatResetTime } from '../useRateLimit';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow attempts within limit', () => {
    const { result } = renderHook(() =>
      useRateLimit({
        maxAttempts: 5,
        windowMs: 60000,
      })
    );

    // First attempt should succeed
    act(() => {
      const allowed = result.current.checkLimit();
      expect(allowed).toBe(true);
    });

    expect(result.current.isLimited).toBe(false);
    expect(result.current.attemptsRemaining).toBe(4);
  });

  it('should block attempts when limit exceeded', () => {
    const onLimitExceeded = vi.fn();
    const { result } = renderHook(() =>
      useRateLimit({
        maxAttempts: 3,
        windowMs: 60000,
        onLimitExceeded,
      })
    );

    // Make 3 attempts (should all succeed)
    act(() => {
      result.current.checkLimit();
      result.current.checkLimit();
      result.current.checkLimit();
    });

    expect(result.current.attemptsRemaining).toBe(0);

    // 4th attempt should be blocked
    act(() => {
      const allowed = result.current.checkLimit();
      expect(allowed).toBe(false);
    });

    expect(result.current.isLimited).toBe(true);
    expect(onLimitExceeded).toHaveBeenCalledTimes(1);
  });

  it('should reset after time window expires', () => {
    const { result } = renderHook(() =>
      useRateLimit({
        maxAttempts: 2,
        windowMs: 60000, // 1 minute
      })
    );

    // Make 2 attempts
    act(() => {
      result.current.checkLimit();
      result.current.checkLimit();
    });

    expect(result.current.isLimited).toBe(true);

    // Fast forward 61 seconds (past the window)
    act(() => {
      vi.advanceTimersByTime(61000);
    });

    // Should be allowed again
    act(() => {
      const allowed = result.current.checkLimit();
      expect(allowed).toBe(true);
    });

    expect(result.current.isLimited).toBe(false);
  });

  it('should persist attempts to localStorage', () => {
    const storageKey = 'test-rate-limit';
    const { result } = renderHook(() =>
      useRateLimit({
        maxAttempts: 5,
        windowMs: 60000,
        storageKey,
      })
    );

    // Make an attempt
    act(() => {
      result.current.checkLimit();
    });

    // Check localStorage was updated
    const stored = localStorage.getItem(storageKey);
    expect(stored).toBeTruthy();

    const attempts = JSON.parse(stored!);
    expect(Array.isArray(attempts)).toBe(true);
    expect(attempts.length).toBe(1);
  });

  it('should load attempts from localStorage on mount', () => {
    const storageKey = 'test-rate-limit-2';
    const now = Date.now();

    // Pre-populate localStorage with 2 attempts
    localStorage.setItem(storageKey, JSON.stringify([now - 5000, now - 3000]));

    const { result } = renderHook(() =>
      useRateLimit({
        maxAttempts: 5,
        windowMs: 60000,
        storageKey,
      })
    );

    // Should have 3 attempts remaining (5 - 2)
    expect(result.current.attemptsRemaining).toBe(3);
  });

  it('should ignore expired attempts from localStorage', () => {
    const storageKey = 'test-rate-limit-3';
    const now = Date.now();

    // Add old attempt (70 seconds ago) and recent attempt (10 seconds ago)
    localStorage.setItem(
      storageKey,
      JSON.stringify([now - 70000, now - 10000])
    );

    const { result } = renderHook(() =>
      useRateLimit({
        maxAttempts: 5,
        windowMs: 60000, // 1 minute window
        storageKey,
      })
    );

    // Should only count the recent attempt (old one expired)
    expect(result.current.attemptsRemaining).toBe(4);
  });

  it('should reset all attempts when reset() is called', () => {
    const { result } = renderHook(() =>
      useRateLimit({
        maxAttempts: 3,
        windowMs: 60000,
      })
    );

    // Make 3 attempts (reach limit)
    act(() => {
      result.current.checkLimit();
      result.current.checkLimit();
      result.current.checkLimit();
    });

    expect(result.current.isLimited).toBe(true);
    expect(result.current.attemptsRemaining).toBe(0);

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.isLimited).toBe(false);
    expect(result.current.attemptsRemaining).toBe(3);
  });

  it('should calculate resetIn time correctly', () => {
    const { result } = renderHook(() =>
      useRateLimit({
        maxAttempts: 2,
        windowMs: 60000, // 1 minute
      })
    );

    // Make 2 attempts
    act(() => {
      result.current.checkLimit();
      result.current.checkLimit();
    });

    // resetIn should be approximately 60000ms (1 minute)
    expect(result.current.resetIn).toBeGreaterThan(59000);
    expect(result.current.resetIn).toBeLessThanOrEqual(60000);

    // Fast forward 30 seconds
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    // resetIn should be approximately 30000ms now
    expect(result.current.resetIn).toBeGreaterThan(29000);
    expect(result.current.resetIn).toBeLessThanOrEqual(30000);
  });

  it('should update state every second', () => {
    const { result } = renderHook(() =>
      useRateLimit({
        maxAttempts: 2,
        windowMs: 60000,
      })
    );

    // Make 2 attempts
    act(() => {
      result.current.checkLimit();
      result.current.checkLimit();
    });

    const initialResetIn = result.current.resetIn;

    // Fast forward 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // resetIn should have decreased by ~1 second
    expect(result.current.resetIn).toBeLessThan(initialResetIn);
    expect(result.current.resetIn).toBeGreaterThanOrEqual(initialResetIn - 1100);
  });

  it('should handle multiple rapid attempts correctly', () => {
    const { result } = renderHook(() =>
      useRateLimit({
        maxAttempts: 10,
        windowMs: 60000,
      })
    );

    // Make 15 rapid attempts
    const results: boolean[] = [];
    act(() => {
      for (let i = 0; i < 15; i++) {
        results.push(result.current.checkLimit());
      }
    });

    // First 10 should succeed, last 5 should fail
    expect(results.slice(0, 10).every(r => r === true)).toBe(true);
    expect(results.slice(10).every(r => r === false)).toBe(true);
    expect(result.current.isLimited).toBe(true);
  });

  it('should handle edge case of zero remaining attempts', () => {
    const { result } = renderHook(() =>
      useRateLimit({
        maxAttempts: 1,
        windowMs: 60000,
      })
    );

    // Make 1 attempt (reach limit)
    act(() => {
      result.current.checkLimit();
    });

    expect(result.current.attemptsRemaining).toBe(0);
    expect(result.current.isLimited).toBe(true);
  });
});

describe('formatResetTime', () => {
  it('should format seconds correctly', () => {
    expect(formatResetTime(5000)).toBe('5s');
    expect(formatResetTime(30000)).toBe('30s');
    expect(formatResetTime(59000)).toBe('59s');
  });

  it('should format minutes and seconds correctly', () => {
    expect(formatResetTime(65000)).toBe('1m 5s');
    expect(formatResetTime(125000)).toBe('2m 5s');
    expect(formatResetTime(3599000)).toBe('59m 59s');
  });

  it('should format hours, minutes, and seconds correctly', () => {
    expect(formatResetTime(3665000)).toBe('1h 1m 5s');
    expect(formatResetTime(7265000)).toBe('2h 1m 5s');
  });

  it('should handle zero or negative values', () => {
    expect(formatResetTime(0)).toBe('0s');
    expect(formatResetTime(-1000)).toBe('0s');
  });

  it('should format exact minutes', () => {
    expect(formatResetTime(60000)).toBe('1m');
    expect(formatResetTime(120000)).toBe('2m');
    expect(formatResetTime(600000)).toBe('10m');
  });

  it('should format exact hours', () => {
    expect(formatResetTime(3600000)).toBe('1h');
    expect(formatResetTime(7200000)).toBe('2h');
  });

  it('should omit zero components', () => {
    expect(formatResetTime(3600000)).toBe('1h'); // No minutes or seconds
    expect(formatResetTime(3660000)).toBe('1h 1m'); // No seconds
    expect(formatResetTime(61000)).toBe('1m 1s'); // No hours
  });
});

describe('useRateLimit - Real-world scenarios', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should handle catch submission rate limit (10/hour)', () => {
    const { result } = renderHook(() =>
      useRateLimit({
        maxAttempts: 10,
        windowMs: 60 * 60 * 1000, // 1 hour
        storageKey: 'catch-submit-limit',
      })
    );

    // Submit 10 catches
    for (let i = 0; i < 10; i++) {
      act(() => {
        expect(result.current.checkLimit()).toBe(true);
      });
    }

    // 11th should be blocked
    act(() => {
      expect(result.current.checkLimit()).toBe(false);
    });

    expect(result.current.isLimited).toBe(true);
  });

  it('should handle comment submission rate limit (30/hour)', () => {
    const { result } = renderHook(() =>
      useRateLimit({
        maxAttempts: 30,
        windowMs: 60 * 60 * 1000, // 1 hour
        storageKey: 'comment-submit-limit',
      })
    );

    // Submit 30 comments
    for (let i = 0; i < 30; i++) {
      act(() => {
        expect(result.current.checkLimit()).toBe(true);
      });
    }

    // 31st should be blocked
    act(() => {
      expect(result.current.checkLimit()).toBe(false);
    });

    expect(result.current.isLimited).toBe(true);
  });

  it('should handle report submission rate limit (5/hour)', () => {
    const onLimitExceeded = vi.fn();
    const { result } = renderHook(() =>
      useRateLimit({
        maxAttempts: 5,
        windowMs: 60 * 60 * 1000, // 1 hour
        storageKey: 'report-submit-limit',
        onLimitExceeded,
      })
    );

    // Submit 5 reports
    for (let i = 0; i < 5; i++) {
      act(() => {
        expect(result.current.checkLimit()).toBe(true);
      });
    }

    // 6th should be blocked and trigger callback
    act(() => {
      expect(result.current.checkLimit()).toBe(false);
    });

    expect(result.current.isLimited).toBe(true);
    expect(onLimitExceeded).toHaveBeenCalledTimes(1);
  });

  it('should handle page reload with existing attempts', () => {
    const storageKey = 'catch-submit-limit';
    const now = Date.now();

    // Simulate 5 catches already submitted
    localStorage.setItem(
      storageKey,
      JSON.stringify([
        now - 10000,
        now - 20000,
        now - 30000,
        now - 40000,
        now - 50000,
      ])
    );

    const { result } = renderHook(() =>
      useRateLimit({
        maxAttempts: 10,
        windowMs: 60 * 60 * 1000,
        storageKey,
      })
    );

    // Should have 5 remaining (10 - 5)
    expect(result.current.attemptsRemaining).toBe(5);

    // Submit 5 more
    for (let i = 0; i < 5; i++) {
      act(() => {
        expect(result.current.checkLimit()).toBe(true);
      });
    }

    // Now should be limited
    expect(result.current.isLimited).toBe(true);
  });
});
