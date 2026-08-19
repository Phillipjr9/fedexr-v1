export const PACKAGE_SIZES = [
  { id: 'envelope', label: 'Envelope / documents', hint: 'Up to 8 oz' },
  { id: 'small', label: 'Small box', hint: 'Under 10 lb' },
  { id: 'medium', label: 'Medium box', hint: '10–30 lb' },
  { id: 'large', label: 'Large box', hint: '30–50 lb' },
  { id: 'xl', label: 'Extra large', hint: '50–70 lb' },
  { id: 'freight', label: 'Pallet / freight', hint: '70+ lb' },
] as const;

const BASE: Record<string, number> = {
  envelope: 12.45,
  small: 18.95,
  medium: 29.75,
  large: 48.2,
  xl: 72.4,
  freight: 186,
};

const SERVICE_MULT: Record<string, number> = {
  'FedEx Ground': 1,
  'FedEx Home Delivery': 1.08,
  'FedEx Express Saver': 1.25,
  'FedEx 2Day': 1.55,
  'FedEx 2Day A.M.': 1.7,
  'FedEx Standard Overnight': 2.1,
  'FedEx Priority Overnight': 2.45,
  'FedEx First Overnight': 3.1,
  'FedEx International Economy': 2.2,
  'FedEx International Priority': 3.4,
  'FedEx Freight': 1.15,
  'FedEx SameDay': 4.2,
};

export function quoteFee(sizeId: string, service: string) {
  const base = BASE[sizeId] ?? BASE.medium;
  const mult = SERVICE_MULT[service] ?? 1;
  return Math.round(base * mult * 100) / 100;
}

export function formatFee(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}
