import { add, format, addBusinessDays } from 'date-fns';

export function getDeliveryDate(serviceId: string): string {
  const now = new Date();
  switch (serviceId) {
    case 'sameday':
      return format(now, "EEEE, MMMM do 'at' h:mm a");
    case 'overnight':
    case 'priority':
    case 'standard':
      return format(add(now, { days: 1 }), "EEEE, MMMM do");
    case '2day':
      return format(addBusinessDays(now, 2), "EEEE, MMMM do");
    case 'ground':
      return format(addBusinessDays(now, 5), "EEEE, MMMM do");
    default:
      return 'N/A';
  }
}
