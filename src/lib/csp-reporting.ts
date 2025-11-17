/**
 * CSP Violation Reporting
 *
 * Captures and logs Content Security Policy violations.
 * Helps identify blocked resources and potential security issues.
 *
 * SEC-004: CSP violation monitoring
 */

export interface CSPViolationReport {
  documentURI: string;
  violatedDirective: string;
  effectiveDirective: string;
  originalPolicy: string;
  blockedURI: string;
  statusCode: number;
  sourceFile?: string;
  lineNumber?: number;
  columnNumber?: number;
}

/**
 * Logs CSP violation to console with clear formatting
 */
const logViolation = (report: CSPViolationReport): void => {
  console.group('🔒 CSP Violation Detected');
  console.warn('Blocked URI:', report.blockedURI);
  console.warn('Violated Directive:', report.violatedDirective);
  console.warn('Effective Directive:', report.effectiveDirective);

  if (report.sourceFile) {
    console.warn(
      'Source:',
      `${report.sourceFile}:${report.lineNumber}:${report.columnNumber}`
    );
  }

  console.groupCollapsed('Full Report');
  console.log(report);
  console.groupEnd();

  console.groupEnd();
};

/**
 * Determines if a violation should be ignored (known/expected violations)
 */
const shouldIgnoreViolation = (report: CSPViolationReport): boolean => {
  const blockedURI = report.blockedURI;

  // Ignore Vercel preview feedback widget (expected to be blocked)
  if (blockedURI.includes('vercel.live/_next-live/feedback')) {
    return true;
  }

  // Ignore browser extensions
  if (
    blockedURI.startsWith('chrome-extension://') ||
    blockedURI.startsWith('moz-extension://') ||
    blockedURI.startsWith('safari-extension://')
  ) {
    return true;
  }

  return false;
};

/**
 * Sends violation report to server endpoint (if configured)
 *
 * NOTE: For Vite/React apps, you'll need to set up a separate backend
 * service to receive these reports. Options:
 * - Vercel Serverless Function
 * - Supabase Edge Function
 * - Third-party service (Sentry, LogRocket, etc.)
 */
const sendViolationToServer = async (
  report: CSPViolationReport
): Promise<void> => {
  const endpoint = import.meta.env.VITE_CSP_REPORT_ENDPOINT;

  if (!endpoint) {
    // No endpoint configured - console logging only
    return;
  }

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        report,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }),
    });
  } catch (error) {
    console.error('Failed to send CSP violation report:', error);
  }
};

/**
 * Initialises CSP violation monitoring
 * Call this once at app startup
 */
export const initCSPReporting = (): void => {
  // Listen for CSP violations
  document.addEventListener('securitypolicyviolation', (event) => {
    const report: CSPViolationReport = {
      documentURI: event.documentURI,
      violatedDirective: event.violatedDirective,
      effectiveDirective: event.effectiveDirective,
      originalPolicy: event.originalPolicy,
      blockedURI: event.blockedURI,
      statusCode: event.statusCode,
      sourceFile: event.sourceFile,
      lineNumber: event.lineNumber,
      columnNumber: event.columnNumber,
    };

    // Skip known/expected violations
    if (shouldIgnoreViolation(report)) {
      return;
    }

    // Log to console
    logViolation(report);

    // Send to server (if endpoint configured)
    sendViolationToServer(report);
  });

  console.log('✅ CSP violation monitoring initialised');
};

/**
 * Test CSP by intentionally triggering a violation
 * Use this in dev console to verify reporting works
 *
 * Usage:
 *   testCSPViolation()
 */
export const testCSPViolation = (): void => {
  console.log('🧪 Testing CSP violation reporting...');
  console.log('This should trigger a CSP violation for script-src');

  // Try to load an external script (will be blocked by CSP)
  const script = document.createElement('script');
  script.src = 'https://example.com/test-csp.js';
  document.head.appendChild(script);

  console.log('Check console for CSP violation report');
};

declare global {
  interface Window {
    testCSPViolation?: typeof testCSPViolation;
  }
}

// Expose test function to window for console testing
if (typeof window !== 'undefined') {
  window.testCSPViolation = testCSPViolation;
}
