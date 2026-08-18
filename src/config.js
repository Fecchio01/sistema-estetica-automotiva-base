// Public browser configuration may be provided by the hosting page as:
// globalThis.__SUPABASE_PUBLIC_CONFIG__ = { url, publishableKey }
// Only publishable browser credentials belong in this object or frontend source files.
const publicConfig = globalThis.__SUPABASE_PUBLIC_CONFIG__ ?? {}

export const SUPABASE_URL = publicConfig.url ?? 'https://qqrbfpdenhhellgbgimo.supabase.co'
export const SUPABASE_PUBLISHABLE_KEY = publicConfig.publishableKey ?? 'sb_publishable_50lS6im_8U9gFZrW5khJeg_yTtDACY2'
