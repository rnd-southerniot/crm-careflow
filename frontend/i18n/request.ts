// apps/<your-app>/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const maybeLocale = await requestLocale;
  const locale = maybeLocale && hasLocale(routing.locales, maybeLocale)
    ? maybeLocale
    : routing.defaultLocale;
  const messages = (await import(`../messages/${locale}.json`)).default;
  return { locale, messages };
});
