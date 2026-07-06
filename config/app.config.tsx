const appConfig = {
  analyticsId: process.env.NEXT_PUBLIC_GA_ID ?? "",
  // Cached departures older than this are treated as absent (fall through to demo data).
  departuresCacheTtlMs: 60 * 60 * 1000,
};

export default appConfig;
