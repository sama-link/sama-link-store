import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Exclude /api/* so route handlers (e.g. /api/track-order proxy) bypass
    // the i18n locale rewrite and aren't redirected to /en/api/...
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
