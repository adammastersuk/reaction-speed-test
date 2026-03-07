const FALLBACK_TIMEZONE = 'UTC';

function isValidTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat('en-GB', { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function getAppTimeZone(): string {
  const configuredTimeZone = process.env.APP_TIMEZONE?.trim();

  if (!configuredTimeZone) {
    return FALLBACK_TIMEZONE;
  }

  return isValidTimeZone(configuredTimeZone) ? configuredTimeZone : FALLBACK_TIMEZONE;
}
