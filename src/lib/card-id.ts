const CARD_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Card ids are UUIDs; anything else can't be one, so don't query for it.
export function isCardId(value: string): boolean {
  return CARD_ID_PATTERN.test(value);
}
