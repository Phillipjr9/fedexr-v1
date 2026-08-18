import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

countries.registerLocale(enLocale);

export function getCountryList(lang = 'en'): { code: string; name: string }[] {
  const names = (countries.getNames(lang) || countries.getNames('en')) as Record<string, string>;
  const list = Object.entries(names).map(([code, name]) => ({ code, name }));
  if (!list.find((c) => c.code === 'XK')) list.push({ code: 'XK', name: 'Kosovo' });
  list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}
