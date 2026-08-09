/**
 * Currency entity — mock API.
 *
 * Static reference data (the platform's list of supported currencies).
 * There is no dedicated currency endpoint in
 * `docs/needed-endpoints-from-backend.md`; this list is served as platform
 * configuration.
 */
import { CurrencyOption } from './model';

/** Supported currencies offered to store owners. */
export const CURRENCIES: CurrencyOption[] = [
  { code: 'SAR', nameEn: 'Saudi Riyal', nameAr: 'ريال سعودي', symbol: 'ر.س' },
  { code: 'USD', nameEn: 'US Dollar', nameAr: 'دولار أمريكي', symbol: '$' },
  { code: 'SYP', nameEn: 'Syrian Pound', nameAr: 'ليرة سورية', symbol: 'ل.س' },
  { code: 'AED', nameEn: 'UAE Dirham', nameAr: 'درهم إماراتي', symbol: 'د.إ' },
  { code: 'EUR', nameEn: 'Euro', nameAr: 'يورو', symbol: '€' },
  { code: 'GBP', nameEn: 'British Pound', nameAr: 'جنيه إسترليني', symbol: '£' },
  { code: 'KWD', nameEn: 'Kuwaiti Dinar', nameAr: 'دينار كويتي', symbol: 'د.ك' },
  { code: 'QAR', nameEn: 'Qatari Riyal', nameAr: 'ريال قطري', symbol: 'ر.ق' },
  { code: 'TRY', nameEn: 'Turkish Lira', nameAr: 'ليرة تركية', symbol: '₺' },
];

/** Returns the supported currencies (static reference data). */
export async function getCurrencies(): Promise<CurrencyOption[]> {
  return new Promise(resolve => setTimeout(() => resolve(CURRENCIES), 100));
}
