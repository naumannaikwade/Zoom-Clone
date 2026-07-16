import { describe, expect, test } from 'vitest';
import { shouldHandleUnauthorized } from './base';

const unauthorizedError = (url, authorization) => ({
  response: { status: 401 },
  config: {
    url,
    headers: authorization ? { Authorization: authorization } : {},
  },
});

describe('API unauthorized handling', () => {
  test('keeps login errors on the page', () => {
    expect(shouldHandleUnauthorized(
      unauthorizedError('/auth/login', 'Bearer stale-token')
    )).toBe(false);
  });

  test('does not redirect for an unauthenticated public request', () => {
    expect(shouldHandleUnauthorized(
      unauthorizedError('/public-resource')
    )).toBe(false);
  });

  test('handles an expired authenticated session', () => {
    expect(shouldHandleUnauthorized(
      unauthorizedError('/auth/me', 'Bearer expired-token')
    )).toBe(true);
  });
});
