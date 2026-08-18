export function getMarkerSizeForZoom(zoomLevel: number): number {
  const clampedZoom = Math.max(0, Math.min(18, zoomLevel));
  const minSize = 16;
  const maxSize = 44;
  const zoomRatio = clampedZoom / 18;

  return Math.round(maxSize - (maxSize - minSize) * zoomRatio);
}

export function getMarkerUncertaintyHaloForZoom(zoomLevel: number): number {
  const clampedZoom = Math.max(0, Math.min(18, zoomLevel));
  const maxHalo = 24;
  const zoomRatio = clampedZoom / 18;

  return Math.max(0, Math.round(maxHalo * (1 - zoomRatio)));
}
