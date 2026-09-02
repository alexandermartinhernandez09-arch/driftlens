function suggestMedianAnchor(items) {
  if (!items.length) return null;
  if (items.length === 1) return items[0].id;
  if (items.length === 2) return items[0].id;

  let best = items[0];
  let bestScore = Infinity;

  items.forEach((candidate) => {
    let sum = 0;
    let n = 0;
    items.forEach((other) => {
      if (other.id === candidate.id) return;
      sum += hammingHex(candidate.dhash, other.dhash);
      n++;
    });
    const avg = n ? sum / n : 0;
    if (avg < bestScore) {
      bestScore = avg;
      best = candidate;
    }
  });

  return best.id;
}

function medianAnchorLabel(items, anchorId) {
  const suggested = suggestMedianAnchor(items);
  if (!suggested || suggested === anchorId) return null;
  const item = items.find((entry) => entry.id === suggested);
  return item ? item.name : null;
}
