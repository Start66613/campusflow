// Shared hit testing for the floating tab bar and segmented controls.
// Fractional positions keep the lens attached to a finger; rounding commits a choice.
export function selectionPosition(x: number, inset: number, itemWidth: number, count: number): number {
  'worklet';
  if (!Number.isFinite(x) || !Number.isFinite(inset) || !Number.isFinite(itemWidth) || itemWidth <= 0 || count <= 0) return 0;
  return Math.max(0, Math.min(count - 1, (x - inset) / itemWidth - 0.5));
}

export function selectionIndex(x: number, inset: number, itemWidth: number, count: number): number {
  'worklet';
  return Math.round(selectionPosition(x, inset, itemWidth, count));
}

// Keep a picker-like tick from buzzing when a finger jitters around a center boundary.
export function selectionTickIndex(position: number, previousIndex: number, count: number): number {
  'worklet';
  if (!Number.isFinite(position) || !Number.isFinite(previousIndex) || count <= 0) return 0;
  const previous = Math.max(0, Math.min(count - 1, Math.round(previousIndex)));
  return Math.abs(position - previous) >= 0.58
    ? Math.max(0, Math.min(count - 1, Math.round(position)))
    : previous;
}
