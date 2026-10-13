export const PERFORMANCE_CONFIG = {
  rateLimit: {
    windowMs: 60 * 1000,
    max: 60,
  },
  cache: {
    defaultTtl: 60_000,
    courseListTtl: 5 * 60_000,
    textbookListTtl: 10 * 60_000,
  },
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
};
