import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  staffId: string;
  branchId: string;
}

const ISSUER = 'christalin-mirrors';

/**
 * v1: a single 12-hour access token. No refresh token, no rotation, no denylist.
 *
 * Accepted risk: a deactivated staff member's token stays valid until it expires.
 * With 12h lifetime and a small trusted team this is acceptable, and it is a
 * SMALLER window than the 7-day refresh token it replaces — which could not be
 * revoked at all because bcrypt truncated it at 72 bytes.
 */
// ponytail: no server-side revocation. ceiling is a 12h window after deactivation.
// upgrade: add User.tokenVersion when staff count, turnover, or franchise use grows.
export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '12h',
    issuer: ISSUER,
    algorithm: 'HS256',
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET, {
    issuer: ISSUER,
    algorithms: ['HS256'],
  }) as TokenPayload;
}
