/** Lightweight US city suggestions for admin forms (no API key). */
export const US_CITIES = [
  'New York, NY US',
  'Los Angeles, CA US',
  'Chicago, IL US',
  'Houston, TX US',
  'Phoenix, AZ US',
  'Philadelphia, PA US',
  'San Antonio, TX US',
  'San Diego, CA US',
  'Dallas, TX US',
  'San Jose, CA US',
  'Austin, TX US',
  'Jacksonville, FL US',
  'Fort Worth, TX US',
  'Columbus, OH US',
  'Charlotte, NC US',
  'Indianapolis, IN US',
  'San Francisco, CA US',
  'Seattle, WA US',
  'Denver, CO US',
  'Washington, DC US',
  'Boston, MA US',
  'El Paso, TX US',
  'Nashville, TN US',
  'Detroit, MI US',
  'Oklahoma City, OK US',
  'Portland, OR US',
  'Las Vegas, NV US',
  'Memphis, TN US',
  'Louisville, KY US',
  'Baltimore, MD US',
  'Milwaukee, WI US',
  'Albuquerque, NM US',
  'Tucson, AZ US',
  'Fresno, CA US',
  'Sacramento, CA US',
  'Mesa, AZ US',
  'Kansas City, MO US',
  'Atlanta, GA US',
  'Miami, FL US',
  'Raleigh, NC US',
  'Omaha, NE US',
  'Minneapolis, MN US',
  'Cleveland, OH US',
  'Tampa, FL US',
  'Orlando, FL US',
  'St. Louis, MO US',
  'Pittsburgh, PA US',
  'Cincinnati, OH US',
  'Newark, NJ US',
  'Brooklyn, NY US',
  'Queens, NY US',
  'Bronx, NY US',
  'Jersey City, NJ US',
  'Buffalo, NY US',
  'Rochester, NY US',
  'Albany, NY US',
  'Avenel, NJ US',
  'Florissant, MO US',
  'Brookfield, WI US',
  'Mccordsville, IN US',
  'Champaign, IL US',
  'Mountville, PA US',
  'Middletown, PA US',
  'Memphis Hub, TN US',
  'Indianapolis Hub, IN US',
  'Oakland, CA US',
  'Oakland Hub, CA US',
  'Memphis Superhub, TN US',
  'Newark Hub, NJ US',
  'Chicago Hub, IL US',
  'Los Angeles Hub, CA US',
  'Dallas Hub, TX US',
  'Atlanta Hub, GA US',
];

export function suggestPlaces(query: string, limit = 8): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return US_CITIES.slice(0, limit);
  return US_CITIES.filter((c) => c.toLowerCase().includes(q)).slice(0, limit);
}

/** FedEx-style 12-digit tracking number */
export function generateTrackingNumber() {
  const now = Date.now().toString();
  const rand = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0');
  // 12 digits, starts with 39 (common domestic-looking prefix pattern)
  return `39${now.slice(-4)}${rand}`.slice(0, 12);
}

export const FEDEX_SERVICES = [
  'FedEx Ground',
  'FedEx Home Delivery',
  'FedEx Express Saver',
  'FedEx 2Day',
  'FedEx 2Day A.M.',
  'FedEx Standard Overnight',
  'FedEx Priority Overnight',
  'FedEx First Overnight',
  'FedEx International Economy',
  'FedEx International Priority',
  'FedEx Freight',
  'FedEx SameDay',
] as const;
