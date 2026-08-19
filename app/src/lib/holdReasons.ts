export type HoldReason = {
  id: string;
  label: string;
  full?: string;
};

export const HOLD_REASONS: HoldReason[] = [
  { id: 'customs', label: 'Customs inspection required', full: 'Package held for customs inspection.' },
  { id: 'clearance', label: 'Clearance delay — additional documents needed', full: 'Clearance delay; additional documents are required.' },
  { id: 'restricted', label: 'Restricted or prohibited item review', full: 'Held for restricted or prohibited item review.' },
  { id: 'address', label: 'Incorrect or incomplete address', full: 'Held due to incorrect or incomplete address.' },
  { id: 'recipient', label: 'Recipient not available', full: 'Recipient was not available for delivery.' },
  { id: 'no_one_home', label: 'No one home to sign for delivery', full: 'No one was home to sign for delivery.' },
  { id: 'business_closed', label: 'Business closed at time of delivery', full: 'Business was closed at the time of delivery.' },
  { id: 'access', label: 'Delivery attempted — access issue', full: 'Delivery attempted; access issue at location.' },
  { id: 'duties', label: 'Payment or duties pending', full: 'Held pending payment or duties.' },
  { id: 'cod', label: 'COD or postage due', full: 'Held for COD or postage due.' },
  { id: 'weather', label: 'Weather or operational delay', full: 'Weather or operational delay.' },
  { id: 'vehicle', label: 'Vehicle breakdown or mechanical delay', full: 'Vehicle breakdown or mechanical delay.' },
  { id: 'congestion', label: 'Network congestion at sort facility', full: 'Network congestion at sort facility.' },
  { id: 'missed_sort', label: 'Missed sort / late arrival at hub', full: 'Missed sort or late arrival at hub.' },
  { id: 'damaged', label: 'Package damaged — inspection needed', full: 'Package damaged; inspection needed.' },
  { id: 'leaking', label: 'Suspected damaged or leaking contents', full: 'Suspected damaged or leaking contents.' },
  { id: 'security', label: 'Security or contents screening', full: 'Security or contents screening.' },
  { id: 'weight', label: 'Weight or dimension discrepancy', full: 'Weight or dimension discrepancy.' },
  { id: 'hold_recipient', label: 'Held at location by recipient request', full: 'Held at location by recipient request.' },
  { id: 'hold_shipper', label: 'Held at location by shipper request', full: 'Held at location by shipper request.' },
  { id: 'vacation', label: 'Vacation hold', full: 'Vacation hold requested.' },
  { id: 'redirect', label: 'Redirect requested — waiting for new address', full: 'Redirect requested; waiting for new address.' },
  { id: 'holiday', label: 'Local holiday — no delivery today', full: 'Local holiday; no delivery today.' },
  { id: 'address_change', label: 'Address change pending verification', full: 'Address change pending verification.' },
  { id: 'adult_sig', label: 'Adult signature required — ID not presented', full: 'Adult signature required; ID not presented.' },
  { id: 'other', label: 'Other' },
];

/** Labels only — for simple <select> lists (admin create flow). */
export const HOLD_REASON_LABELS = HOLD_REASONS.map((r) => r.label);

/** Build the full reason string saved on a hold request. */
export function reasonText(reasonId: string, customReason = '') {
  const selected = HOLD_REASONS.find((r) => r.id === reasonId);
  if (!selected) return customReason.trim();
  if (selected.id === 'other') return customReason.trim();
  return selected.full || selected.label;
}
