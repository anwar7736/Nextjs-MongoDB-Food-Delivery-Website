export function matchesSearch(query, ...values) {
  const searchTerm = query.trim().toLocaleLowerCase();
  if (searchTerm.length < 2) return true;

  return values.flat(Infinity).some((value) =>
    (typeof value === "string" || typeof value === "number") &&
    String(value).toLocaleLowerCase().includes(searchTerm)
  );
}

export function matchesOrderSearch(order, query) {
  const relatedDetails = ["restaurant", "user", "delivery", "status"].flatMap((key) =>
    (Array.isArray(order[key]) ? order[key] : []).flatMap((details) => [
      details?.name,
      details?.phone,
      details?.address,
    ])
  );

  return matchesSearch(query, order.invoice_no, ...relatedDetails);
}
