/**
 * Rate Limiting Hook
 *
 * RATE-001: Client-side rate limiting for form submissions
 * Phase 3: Production Hardening & Optimization
 *
 * Prevents spam and abuse by limiting how often users can perform actions.
 * This is the first line of defense - server-side rate limiting is also required.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface RateLimitOptions {
  /**
   * Maximum number of attempts allowed within the time window
   * @example 5 - Allow 5 attempts
   */
  maxAttempts: number;

  /**
   * Time window in milliseconds
   * @example 60000 - 1 minute window
   */
  windowMs: number;

  /**
   * Callback when rate limit is exceeded
   */
  onLimitExceeded?: () => void;

  /**
   * Storage key for persisting attempts across page reloads
   * If provided, attempts are stored in localStorage
   */
  storageKey?: string;
}

export interface RateLimitState {
  /**
   * Check if the action can be performed
   * @returns true if action is allowed, false if rate limited
   */
  checkLimit: () => boolean;

  /**
   * Whether the user is currently rate limited
   */
  isLimited: boolean;

  /**
   * Number of attempts remaining in current window
   */
  attemptsRemaining: number;

  /**
   * Time in ms until rate limit resets
   */
  resetIn: number;

  /**
   * Reset the rate limit (clears all attempts)
   */
  reset: () => void;
}

/**
 * Hook for implementing client-side rate limiting
 *
 * @example
 * ```tsx
 * const AddCatch = () => {
 *   const { checkLimit, isLimited, attemptsRemaining } = useRateLimit({
 *     maxAttempts: 5,
 *     windowMs: 60000, // 1 minute
 *     storageKey: 'catch-submit-limit',
 *     onLimitExceeded: () => {
 *       toast.error('Too many submissions. Please wait a minute.');
 *     },
 *   });
 *
 *   const handleSubmit = async () => {
 *     if (!checkLimit()) {
 *       return; // Rate limited
 *     }
 *
 *     // Proceed with submission
 *     await submitCatch();
 *   };
 *
 *   return (
 *     <Button
 *       onClick={handleSubmit}
 *       disabled={isLimited}
 *     >
 *       Submit ({attemptsRemaining} remaining)
 *     </Button>
 *   );
 * };
 * ```
 */
export const useRateLimit = (options: RateLimitOptions): RateLimitState => {
  const { maxAttempts, windowMs, onLimitExceeded, storageKey } = options;

  // Store attempt timestamps
  const attemptsRef = useRef<number[]>([]);
  const [isLimited, setIsLimited] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(maxAttempts);
  const [resetIn, setResetIn] = useState(0);

  // Save attempts to localStorage
  const saveAttempts = useCallback(() => {
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(attemptsRef.current));
      } catch (error) {
        console.error('Failed to save rate limit state:', error);
      }
    }
  }, [storageKey]);

  // Update state based on current attempts
  const updateState = useCallback(() => {
    const now = Date.now();

    // Remove attempts outside the window
    attemptsRef.current = attemptsRef.current.filter(
      timestamp => now - timestamp < windowMs
    );

    const currentAttempts = attemptsRef.current.length;
    const remaining = Math.max(0, maxAttempts - currentAttempts);
    const limited = currentAttempts >= maxAttempts;

    setAttemptsRemaining(remaining);
    setIsLimited(limited);

    // Calculate reset time (time until oldest attempt expires)
    if (attemptsRef.current.length > 0) {
      const oldestAttempt = Math.min(...attemptsRef.current);
      const resetTime = oldestAttempt + windowMs - now;
      setResetIn(Math.max(0, resetTime));
    } else {
      setResetIn(0);
    }

    saveAttempts();
  }, [maxAttempts, windowMs, saveAttempts]);

  // Load attempts from localStorage on mount
  useEffect(() => {
    if (storageKey) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const attempts: number[] = JSON.parse(stored);
          const now = Date.now();
          // Filter out expired attempts
          const validAttempts = attempts.filter(
            timestamp => now - timestamp < windowMs
          );
          attemptsRef.current = validAttempts;
          updateState();
        }
      } catch (error) {
        console.error('Failed to load rate limit state:', error);
      }
    }
  }, [storageKey, updateState, windowMs]);

  // Auto-update state every second to keep resetIn accurate
  useEffect(() => {
    const interval = setInterval(() => {
      updateState();
    }, 1000);

    return () => clearInterval(interval);
  }, [updateState]);

  /**
   * Check if action can be performed
   */
  const checkLimit = useCallback(() => {
    const now = Date.now();

    // Remove attempts outside the window
    attemptsRef.current = attemptsRef.current.filter(
      timestamp => now - timestamp < windowMs
    );

    // Check if limit exceeded
    if (attemptsRef.current.length >= maxAttempts) {
      setIsLimited(true);
      onLimitExceeded?.();
      updateState();
      return false;
    }

    // Record this attempt
    attemptsRef.current.push(now);
    updateState();
    return true;
  }, [maxAttempts, windowMs, onLimitExceeded, updateState]);

  /**
   * Reset the rate limit
   */
  const reset = useCallback(() => {
    attemptsRef.current = [];
    setIsLimited(false);
    setAttemptsRemaining(maxAttempts);
    setResetIn(0);
    saveAttempts();
  }, [maxAttempts, saveAttempts]);

  return {
    checkLimit,
    isLimited,
    attemptsRemaining,
    resetIn,
    reset,
  };
};

/**
 * Format milliseconds to human-readable time
 * @example formatResetTime(65000) // "1m 5s"
 */
export const formatResetTime = (ms: number): string => {
  if (ms <= 0) return '0s';

  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / 1000 / 60) % 60);
  const hours = Math.floor(ms / 1000 / 60 / 60);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);

  return parts.join(' ');
};
