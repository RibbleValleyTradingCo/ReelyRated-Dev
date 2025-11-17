/**
 * TEMPORARY DIAGNOSTIC COMPONENT
 *
 * Use this to debug blank screen issues on Vercel.
 * This component checks environment variables and shows
 * what's actually loaded.
 *
 * To use:
 * 1. Import in src/App.tsx
 * 2. Temporarily replace <Routes> with <DiagnosticPage />
 * 3. Deploy to Vercel
 * 4. Check what values are shown
 * 5. Remove this component when done debugging
 */

export const DiagnosticPage = () => {
  const envVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    VITE_PUBLIC_SITE_URL: import.meta.env.VITE_PUBLIC_SITE_URL,
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
  };

  const getStatus = (value: unknown) => {
    if (value === undefined) return { status: '❌ UNDEFINED', color: 'red' };
    if (value === null) return { status: '⚠️ NULL', color: 'orange' };
    if (value === '') return { status: '⚠️ EMPTY STRING', color: 'orange' };
    return { status: '✅ SET', color: 'green' };
  };

  const maskKey = (key: string | undefined) => {
    if (!key) return 'NOT SET';
    if (key.length < 20) return key;
    return `${key.substring(0, 10)}...${key.substring(key.length - 10)}`;
  };

  return (
    <div style={{
      fontFamily: 'monospace',
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
      backgroundColor: '#f5f5f5'
    }}>
      <h1 style={{ color: '#333' }}>🔍 ReelyRated Diagnostic Page</h1>

      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '2px solid #ddd'
      }}>
        <h2 style={{ marginTop: 0 }}>Environment Variables Status</h2>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Variable</th>
              <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Status</th>
              <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Value (masked)</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(envVars).map(([key, value]) => {
              const { status, color } = getStatus(value);
              const isCritical = key.includes('SUPABASE');

              return (
                <tr key={key} style={{
                  backgroundColor: isCritical && value === undefined ? '#ffebee' : 'white'
                }}>
                  <td style={{
                    padding: '10px',
                    border: '1px solid #ddd',
                    fontWeight: isCritical ? 'bold' : 'normal'
                  }}>
                    {key}
                    {isCritical && <span style={{ color: 'red' }}> *</span>}
                  </td>
                  <td style={{
                    padding: '10px',
                    border: '1px solid #ddd',
                    color
                  }}>
                    {status}
                  </td>
                  <td style={{
                    padding: '10px',
                    border: '1px solid #ddd',
                    fontSize: '12px'
                  }}>
                    {key.includes('KEY') ? maskKey(value) : (value || 'NOT SET')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <p style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
          * Required for app to function
        </p>
      </div>

      <div style={{
        backgroundColor: envVars.VITE_SUPABASE_URL && envVars.VITE_SUPABASE_PUBLISHABLE_KEY ? '#e8f5e9' : '#ffebee',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '2px solid',
        borderColor: envVars.VITE_SUPABASE_URL && envVars.VITE_SUPABASE_PUBLISHABLE_KEY ? '#4caf50' : '#f44336'
      }}>
        <h2 style={{ marginTop: 0 }}>
          {envVars.VITE_SUPABASE_URL && envVars.VITE_SUPABASE_PUBLISHABLE_KEY ? '✅ ' : '❌ '}
          Overall Status
        </h2>

        {envVars.VITE_SUPABASE_URL && envVars.VITE_SUPABASE_PUBLISHABLE_KEY ? (
          <div>
            <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#2e7d32' }}>
              ✅ All required environment variables are set!
            </p>
            <p>The blank screen issue is NOT caused by missing environment variables.</p>
            <p><strong>Next steps:</strong></p>
            <ol>
              <li>Open browser DevTools (F12)</li>
              <li>Check Console tab for JavaScript errors</li>
              <li>Check Network tab for failed requests</li>
              <li>Report any errors you see</li>
            </ol>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#c62828' }}>
              ❌ Missing required environment variables!
            </p>
            <p><strong>To fix in Vercel:</strong></p>
            <ol>
              <li>Go to Vercel Dashboard → Settings → Environment Variables</li>
              <li>Add these variables:
                <ul>
                  {!envVars.VITE_SUPABASE_URL && <li style={{ color: 'red' }}>VITE_SUPABASE_URL</li>}
                  {!envVars.VITE_SUPABASE_PUBLISHABLE_KEY && <li style={{ color: 'red' }}>VITE_SUPABASE_PUBLISHABLE_KEY</li>}
                </ul>
              </li>
              <li>Select all environments (Production, Preview, Development)</li>
              <li>Save and <strong>redeploy</strong></li>
            </ol>
            <p><strong>Where to find values:</strong></p>
            <ol>
              <li>Go to <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer">app.supabase.com</a></li>
              <li>Select your project</li>
              <li>Settings → API</li>
              <li>Copy "Project URL" and "anon public" key</li>
            </ol>
          </div>
        )}
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        border: '2px solid #ddd'
      }}>
        <h2 style={{ marginTop: 0 }}>🔧 Technical Details</h2>

        <table style={{ width: '100%', fontSize: '12px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>Build Mode:</td>
              <td style={{ padding: '8px' }}>{envVars.MODE}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>Development:</td>
              <td style={{ padding: '8px' }}>{envVars.DEV ? 'Yes' : 'No'}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>Production:</td>
              <td style={{ padding: '8px' }}>{envVars.PROD ? 'Yes' : 'No'}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>User Agent:</td>
              <td style={{ padding: '8px', fontSize: '10px' }}>{navigator.userAgent}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>Timestamp:</td>
              <td style={{ padding: '8px' }}>{new Date().toISOString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{
        backgroundColor: '#fff3cd',
        padding: '15px',
        borderRadius: '8px',
        marginTop: '20px',
        border: '2px solid #ffc107'
      }}>
        <p style={{ margin: 0, fontSize: '14px' }}>
          <strong>⚠️ Remember to remove this diagnostic page</strong> before going to production!
          <br />
          This component is for debugging only.
        </p>
      </div>
    </div>
  );
};
