#!/usr/bin/env node
/**
 * One-time OAuth 2.0 setup for GA4 + Search Console access.
 * 
 * This script:
 * 1. Starts a local HTTP server on port 3000
 * 2. Opens a browser for you to log in with your Google account
 * 3. Captures the authorization code from the redirect
 * 4. Exchanges it for a refresh token
 * 5. Outputs the env vars you need to set in Vercel
 * 
 * The refresh token never expires (unless revoked), so this is a ONE-TIME setup.
 */
const http = require('http');
const { execSync } = require('child_process');

// ⚠️ Replace with your actual credentials from Google Cloud Console
// Or set env vars: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET
const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID || 'YOUR_CLIENT_ID.apps.googleusercontent.com';
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3001/callback';
const PORT = 3001;

// Scopes needed: GA4 read + Search Console read
const SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly',
];

// Build the authorization URL
const authUrl = `https://accounts.google.com/o/oauth2/auth?` + new URLSearchParams({
  client_id: CLIENT_ID,
  redirect_uri: REDIRECT_URI,
  response_type: 'code',
  scope: SCOPES.join(' '),
  access_type: 'offline',
  prompt: 'consent', // Forces refresh token even if user has already authorized
});

console.log('');
console.log('╔══════════════════════════════════════════════════════╗');
console.log('║  🔐 Google OAuth Setup — One Time Only               ║');
console.log('╠══════════════════════════════════════════════════════╣');
console.log('║  1. A browser window will open                       ║');
console.log('║  2. Log in with your Google account                  ║');
console.log('║  3. Grant access to GA4 + Search Console             ║');
console.log('║  4. You\'ll be redirected to localhost               ║');
console.log('║     (page may show "Cannot GET" — that\'s OK)         ║');
console.log('╚══════════════════════════════════════════════════════╝');
console.log('');

// Start local server to catch the redirect
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  if (url.pathname === '/callback' && url.searchParams.has('code')) {
    const code = url.searchParams.get('code');
    
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<html><body><h2>✅ Authorization received!</h2><p>You can close this window now.</p></body></html>`);
    
    console.log('✅ Authorization code received. Exchanging for tokens...');
    
    // Exchange authorization code for tokens
    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      });
      
      const tokens = await tokenResponse.json();
      
      if (tokens.refresh_token) {
        console.log('✅ Refresh token obtained!');
        console.log('');
        console.log('╔══════════════════════════════════════════════════════╗');
        console.log('║  📋 Add these to Vercel env vars                     ║');
        console.log('╠══════════════════════════════════════════════════════╣');
        console.log(`║  GOOGLE_CLIENT_ID=${CLIENT_ID}        ║`);
        console.log(`║  GOOGLE_CLIENT_SECRET=${CLIENT_SECRET}           ║`);
        console.log(`║  GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}  ║`);
        console.log('╚══════════════════════════════════════════════════════╝');
        console.log('');
        console.log('I\'ll add these to Vercel now if you want.');
        
        // Also show GA4 property ID prompt
        console.log('');
        console.log('📌 Also need: GA4_PROPERTY_ID (the numeric ID from GA4 Admin → Property Settings)');
        console.log('📌 And: SEARCH_CONSOLE_SITE_URL = sc_domain:me.tony.do');
        
        // Save to a temp file so we can read it
        require('fs').writeFileSync('google-oauth-result.json', JSON.stringify({
          GOOGLE_CLIENT_ID: CLIENT_ID,
          GOOGLE_CLIENT_SECRET: CLIENT_SECRET,
          GOOGLE_REFRESH_TOKEN: tokens.refresh_token,
          access_token: tokens.access_token,
          expires_in: tokens.expires_in,
        }, null, 2));
        console.log('📄 Saved to google-oauth-result.json');
        
      } else {
        console.log('❌ No refresh token received. Response:', JSON.stringify(tokens));
        if (tokens.error) {
          console.log(`   Error: ${tokens.error} — ${tokens.error_description}`);
        }
      }
    } catch (err) {
      console.log('❌ Token exchange failed:', err.message);
    }
    
    server.close();
    process.exit(0);
  }
  
  res.writeHead(404);
  res.end();
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`🌐 Local server listening on http://localhost:${PORT}`);
  console.log('');
  console.log('🔗 Opening browser for Google login...');
  
  // Open the browser
  try {
    execSync(`start "" "${authUrl}"`, { timeout: 5000 });
  } catch {
    console.log(`   Please open this URL manually:\n   ${authUrl}`);
  }
  
  console.log('');
  console.log('⏳ Waiting for you to log in...');
});
