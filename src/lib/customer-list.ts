export type CustomerRow = {
  phone: string;
  lifetime_stamps: number;
  stamps_earned: number;
  stamps_required: number;
  last_stamped_at: string | null;
};

export type CustomerJson = {
  phone: string;
  lifetimeStamps: number;
  stampsEarned: number;
  stampsRequired: number;
  lastStampedAt: string | null;
};

// Most recent visitors first; customers never stamped go last.
export function toCustomerList(rows: CustomerRow[]): CustomerJson[] {
  return [...rows]
    .sort((a, b) => {
      if (a.last_stamped_at === b.last_stamped_at) return 0;
      if (!a.last_stamped_at) return 1;
      if (!b.last_stamped_at) return -1;
      return b.last_stamped_at.localeCompare(a.last_stamped_at);
    })
    .map((row) => ({
      phone: row.phone,
      lifetimeStamps: row.lifetime_stamps,
      stampsEarned: row.stamps_earned,
      stampsRequired: row.stamps_required,
      lastStampedAt: row.last_stamped_at,
    }));
}

// wa.me takes the number as bare digits (country code included, no "+").
export function whatsAppUrl(e164Phone: string, message?: string): string {
  const url = `https://wa.me/${e164Phone.replace(/\D/g, "")}`;
  const text = message?.trim();
  return text ? `${url}?text=${encodeURIComponent(text)}` : url;
}
