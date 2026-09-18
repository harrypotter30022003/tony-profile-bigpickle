export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
export const TOTP_SECRET = process.env.TOTP_SECRET || '';
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';
if (!ADMIN_PASSWORD) throw new Error('Set ADMIN_PASSWORD env var.');
