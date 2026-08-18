export const HOLD_REASONS = [
  {
    id: 'not-home',
    label: 'Not home for delivery',
    full: 'Recipient will not be available at the delivery address during the scheduled delivery window.',
  },
  {
    id: 'secure-pickup',
    label: 'Prefer secure pickup',
    full: 'Recipient prefers to pick up the package at a FedEx location instead of leaving it at the address.',
  },
  {
    id: 'address-issue',
    label: 'Address or access issue',
    full: 'The delivery address is hard to access, incomplete, or the building cannot receive the package today.',
  },
  {
    id: 'vacation',
    label: 'Away / vacation',
    full: 'Recipient is traveling or away and wants the package held until they can collect it.',
  },
  {
    id: 'signature',
    label: 'Needs signature or ID',
    full: 'Package requires a signature or ID check and the recipient wants to complete that at a FedEx location.',
  },
  {
    id: 'business-closed',
    label: 'Business closed',
    full: 'The business delivery location is closed when the courier is expected to arrive.',
  },
  {
    id: 'weather',
    label: 'Weather or delay',
    full: 'Recipient requested a hold because of weather, road conditions, or a known delivery delay.',
  },
  {
    id: 'other',
    label: 'Other (type your own reason)',
    full: '',
  },
] as const;

export function reasonText(id: string, custom = '') {
  const item = HOLD_REASONS.find((r) => r.id === id);
  if (!item) return custom.trim();
  if (item.id === 'other') return custom.trim();
  return item.full;
}
