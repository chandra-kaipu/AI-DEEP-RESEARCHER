"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDbConfig = getDbConfig;
function getDbConfig() {
    const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL || process.env.MONGODB_URI;
    const gdriveKey = process.env.GOOGLE_DRIVE_API_KEY || process.env.GOOGLE_CLIENT_ID;
    let type = 'local';
    if (process.env.DATABASE_URL?.startsWith('postgres') || process.env.SUPABASE_URL) {
        type = 'supabase';
    }
    else if (process.env.MONGODB_URI) {
        type = 'mongodb';
    }
    return {
        type,
        status: dbUrl ? 'connected' : 'local_fallback',
        databaseUrl: dbUrl ? dbUrl.replace(/:[^:]+@/, ':****@') : undefined, // Mask password
        storageProvider: gdriveKey ? 'google-drive' : 'local',
        storageQuota: gdriveKey ? '5 TB Google Cloud Storage Ready' : 'Local Browser + Server Storage (Active)',
    };
}
