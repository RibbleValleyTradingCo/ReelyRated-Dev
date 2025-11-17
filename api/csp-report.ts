/**
 * CSP Violation Report Endpoint
 *
 * Receives Content Security Policy violation reports from the browser
 * and logs them for monitoring.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log the CSP violation
    const violation = req.body['csp-report'];

    if (violation) {
      console.error('CSP Violation Report:', JSON.stringify(violation, null, 2));

      // Log key details
      console.error({
        documentURI: violation['document-uri'],
        violatedDirective: violation['violated-directive'],
        blockedURI: violation['blocked-uri'],
        sourceFile: violation['source-file'],
        lineNumber: violation['line-number'],
      });

      // In production, you might want to:
      // 1. Send to error tracking service (Sentry, Datadog, etc.)
      // 2. Store in database for analysis
      // 3. Alert on critical violations

      // Example: Send to Sentry (uncomment if using Sentry)
      // Sentry.captureMessage('CSP Violation', {
      //   level: 'warning',
      //   extra: { violation }
      // });
    }

    // Return 204 No Content (standard for CSP reports)
    return res.status(204).end();
  } catch (error) {
    console.error('Error processing CSP report:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
