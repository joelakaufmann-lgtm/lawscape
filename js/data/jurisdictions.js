// Aggregate place names only, derived from the supplied July 1, 2026 member
// jurisdiction list. These are curriculum targets, not verified admissions.
export const GLOBAL_CURRICULUM = {
  asOf: '2026-07-01',
  mission: 'Ethics questions from every jurisdiction where there is a LegalQuant.',
  regions: [
    { name: 'Americas', places: ['United States', 'Canada', 'Argentina', 'Uruguay'] },
    { name: 'Europe', places: ['United Kingdom', 'Ireland', 'France', 'Germany', 'Netherlands', 'Belgium', 'Switzerland', 'Austria', 'Italy', 'Greece', 'Finland', 'Russia'] },
    { name: 'Middle East & Africa', places: ['United Arab Emirates', 'Israel', 'Turkey'] },
    { name: 'Asia-Pacific', places: ['Singapore', 'Hong Kong', 'China (mainland)', 'India', 'Malaysia', 'Thailand', 'Australia', 'New Zealand'] },
  ],
};
