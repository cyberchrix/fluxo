//
// --- GROUP BY DAY (AVEC DETAILS) ---
export function groupByDayDetailed(transactions) {
  return transactions.reduce((acc, t) => {
    if (!t.date) return acc;

    if (!acc[t.date]) {
      acc[t.date] = {
        total: 0,
        items: [],
      };
    }

    acc[t.date].total += t.amount;
    acc[t.date].items.push(t);

    return acc;
  }, {});
}

//
// --- GROUP BY CATEGORY ---
export function groupByCategory(transactions) {
  return transactions.reduce((acc, t) => {
    const cat = t.category || "other";
    acc[cat] = (acc[cat] || 0) + t.amount;
    return acc;
  }, {});
}

//
// --- SORT BY DATE DESC ---
export function sortByDateDesc(entries) {
  return entries.sort(([a], [b]) => new Date(b) - new Date(a));
}
