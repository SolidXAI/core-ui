const wholeNumber = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const cost = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 });

export function formatCost(amount: number) {
  return cost.format(amount);
}

export function formatCount(count: number) {
  return (count >= 1_000 ? compactNumber : wholeNumber).format(count);
}

export function formatTokens(count: number) {
  return (count >= 1_000_000 ? compactNumber : wholeNumber).format(count);
}

export function formatDurationMs(duration: number) {
  return wholeNumber.format(duration);
}
