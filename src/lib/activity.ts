import { maskPhone } from "./phone";

export type ActivityRow = {
  id: string;
  kind: "stamp" | "redeem" | "adjust";
  card_id: string;
  stamps_added: number;
  bonus_stamps: number;
  rewards_earned: number;
  rewards_used: number;
  created_at: string;
  undone_at: string | null;
  staff_members: { name: string } | null;
  cards: { phone: string | null } | null;
};

export type ActivityJson = {
  id: string;
  kind: ActivityRow["kind"];
  cardId: string;
  customer: string; // masked phone, or the start of the card code
  staffName: string | null; // null = manager PIN / owner
  stampsAdded: number;
  bonusStamps: number;
  rewardsEarned: number;
  rewardsUsed: number;
  createdAt: string;
  undone: boolean;
};

export function toActivityJson(row: ActivityRow): ActivityJson {
  return {
    id: row.id,
    kind: row.kind,
    cardId: row.card_id,
    customer: row.cards?.phone ? maskPhone(row.cards.phone) : `#${row.card_id.slice(0, 6)}`,
    staffName: row.staff_members?.name ?? null,
    stampsAdded: row.stamps_added,
    bonusStamps: row.bonus_stamps,
    rewardsEarned: row.rewards_earned,
    rewardsUsed: row.rewards_used,
    createdAt: row.created_at,
    undone: row.undone_at !== null,
  };
}

export const ACTIVITY_COLUMNS =
  "id, kind, card_id, stamps_added, bonus_stamps, rewards_earned, rewards_used, created_at, undone_at, staff_members(name), cards(phone)";
