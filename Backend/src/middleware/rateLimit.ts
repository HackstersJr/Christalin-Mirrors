import rateLimit from 'express-rate-limit';

/**
 * Tiered, not global: auth needs far tighter limits than an authenticated list
 * read, and one shared bucket would either fail to protect login or throttle
 * normal admin use.
 *
 * app.set('trust proxy', 1) is required for these to see real client IPs —
 * this deployment sits behind Cloudflare (see Frontend/cloudflared-config.yaml).
 */

/** Brute-force guard. Successful logins don't count against the budget. */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Too many login attempts. Try again in 15 minutes.' },
});

/** Unauthenticated DB write — the tightest limit in the app. */
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Too many messages sent. Please try again later.' },
});

/** Broad backstop for everything else. Generous enough to be invisible in normal use. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
