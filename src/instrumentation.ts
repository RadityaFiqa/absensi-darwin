export async function register() {
  // Ensure this only runs on the Node.js server-side environment and NOT during the build phase
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NEXT_PHASE !== 'phase-production-build') {
    try {
      const { query } = await import('./lib/db');
      
      // Perform a simple dummy query to force db.ts initDb() to run, which registers the cronjob on startup
      await query('SELECT 1');
      console.log('[STARTUP] Successfully initialized database and attendance background worker on server boot.');
    } catch (err: any) {
      console.error('[STARTUP] Failed to initialize background processes on boot:', err.message);
    }
  }
}
