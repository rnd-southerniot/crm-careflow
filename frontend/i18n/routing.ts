// apps/<your-app>/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';

// Define the supported locales as a readonly tuple.
// `as const` ensures TypeScript treats each value as a literal type.
const SUPPORTED_LOCALES = ['en', 'bn','fr'] as const;

// Create a type that represents the allowed locale values: "en" | "bn"
type Locale = (typeof SUPPORTED_LOCALES)[number];

// Read the default locale from environment variable
const envLocale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE as string;

// Ensure the value is one of the supported locales; fallback to 'en' if invalid
const defaultLocale: Locale = SUPPORTED_LOCALES.includes(envLocale as Locale)
  ? (envLocale as Locale)
  : 'en';

// Export the routing configuration for next-intl
export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale,
});
