// Feature flags — set to 'false' in Vercel env vars to disable a feature.
// Defaults to true (all enabled) so local dev works without any .env setup.
// Changing these requires a redeploy (NEXT_PUBLIC_ vars are inlined at build time).
//
// MVP recommended: NEXT_PUBLIC_FEATURE_SCHEDULE=false, NEXT_PUBLIC_FEATURE_FEES=false

export const FEATURES = {
  schedule:  process.env.NEXT_PUBLIC_FEATURE_SCHEDULE  !== 'false',
  fees:      process.env.NEXT_PUBLIC_FEATURE_FEES      !== 'false',
  bookmarks: process.env.NEXT_PUBLIC_FEATURE_BOOKMARKS !== 'false',
  briefings: process.env.NEXT_PUBLIC_FEATURE_BRIEFINGS !== 'false',
} as const

export type FeatureKey = keyof typeof FEATURES
