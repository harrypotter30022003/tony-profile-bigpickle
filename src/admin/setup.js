#!/usr/bin/env node
import crypto from 'crypto';
import fs from 'fs';

const config = `// Security config - CHANGE THESE IN PRODUCTION
const ADMIN_PASSWORD_HASH = '5baa61e4c9b93fcf6cf6c9b93f6cf00f1d8e120b'; // password: admin
const TOTP_SECRET = 'JBSWY3DPEHPK3PXP'; // Change this - use Google Authenticator
`;

fs.writeFileSync('./src/admin/config.js', config);
console.log('Config created. To change password, edit src/admin/config.js');
console.log('\nDefault login:');
console.log('  Password: admin');
console.log('  2FA Secret: JBSWY3DPEHPK3PXP');
console.log('\nTo use:');
console.log('1. Add TOTP_SECRET to Google Authenticator');
console.log('2. npm run admin');
console.log('3. Open http://localhost:3001');