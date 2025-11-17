/**
 * Production Logging System
 * SEC-003: Structured logging with environment-aware behavior
 *
 * Features:
 * - Multiple log levels (error, warn, info, debug)
 * - Environment-aware (production vs development)
 * - Structured metadata support
 * - Ready for external error tracking integration (Sentry, etc.)
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LogMetadata {
  [key: string]: unknown;
}

export interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: unknown;
}

class Logger {
  private isDevelopment: boolean;
  private isTest: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.isTest = import.meta.env.MODE === 'test';
  }

  /**
   * Log an error with optional metadata
   * Always logged in all environments
   */
  error(message: string, error?: Error | unknown, metadata?: LogMetadata): void {
    const logData = this.formatLog('error', message, metadata);

    // In production, this would send to error tracking service (Sentry, etc.)
    console.error(logData.message, logData.metadata);

    if (error instanceof Error) {
      console.error(error);
      // In production: send error.stack to error tracking
    } else if (error) {
      console.error(error);
    }
  }

  /**
   * Log a warning
   * Logged in development and production
   */
  warn(message: string, metadata?: LogMetadata): void {
    const logData = this.formatLog('warn', message, metadata);
    console.warn(logData.message, logData.metadata);
  }

  /**
   * Log informational messages
   * Only logged in development (suppressed in production)
   */
  info(message: string, metadata?: LogMetadata): void {
    if (this.isTest) return;

    if (this.isDevelopment) {
      const logData = this.formatLog('info', message, metadata);
      console.log(logData.message, logData.metadata);
    }
  }

  /**
   * Log debug messages
   * Only logged in development (suppressed in production)
   */
  debug(message: string, metadata?: LogMetadata): void {
    if (this.isTest) return;

    if (this.isDevelopment) {
      const logData = this.formatLog('debug', message, metadata);
      console.log(logData.message, logData.metadata);
    }
  }

  /**
   * Format log data consistently
   */
  private formatLog(level: LogLevel, message: string, metadata?: LogMetadata) {
    return {
      level,
      message,
      metadata: {
        timestamp: new Date().toISOString(),
        environment: import.meta.env.MODE,
        ...metadata,
      },
    };
  }

  /**
   * Create a child logger with context
   * Useful for adding consistent metadata to all logs from a component
   */
  withContext(context: LogContext): ContextLogger {
    return new ContextLogger(this, context);
  }
}

/**
 * Context-aware logger that automatically includes context in all log calls
 */
class ContextLogger {
  constructor(
    private logger: Logger,
    private context: LogContext
  ) {}

  error(message: string, error?: Error | unknown, metadata?: LogMetadata): void {
    this.logger.error(message, error, { ...this.context, ...metadata });
  }

  warn(message: string, metadata?: LogMetadata): void {
    this.logger.warn(message, { ...this.context, ...metadata });
  }

  info(message: string, metadata?: LogMetadata): void {
    this.logger.info(message, { ...this.context, ...metadata });
  }

  debug(message: string, metadata?: LogMetadata): void {
    this.logger.debug(message, { ...this.context, ...metadata });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for context logger
export type { ContextLogger };
