export const ORDER_STATUS_SEEDS = [
  { _id: "674436ad7f3f886666bb47a7", name: "Pending", color: "#f59e0b", status: 1 },
  { _id: "674436ad7f3f886666bb47a8", name: "Preparing", color: "#2563eb", status: 1 },
  { _id: "674436ad7f3f886666bb47a9", name: "Ready for pickup", color: "#7c3aed", status: 1 },
  { _id: "674436ad7f3f886666bb47aa", name: "Picked up", color: "#0891b2", status: 1 },
  { _id: "674436ad7f3f886666bb47ab", name: "On the way", color: "#0d9488", status: 1 },
  { _id: "674436ad7f3f886666bb47ac", name: "Delivered", color: "#16a34a", status: 1 },
  { _id: "674436ad7f3f886666bb47ad", name: "Cancelled", color: "#dc2626", status: 1 },
];

export const ORDER_STATUS_TRANSITIONS = {
  restaurant: {
    Pending: ["Preparing", "Cancelled"],
    Preparing: ["Ready for pickup", "Cancelled"],
  },
  delivery: {
    "Ready for pickup": ["Picked up"],
    "Picked up": ["On the way"],
    "On the way": ["Delivered"],
  },
};

export function canTransitionOrderStatus(accountType, currentName, nextName) {
  return ORDER_STATUS_TRANSITIONS[accountType]?.[currentName]?.includes(nextName) || false;
}
