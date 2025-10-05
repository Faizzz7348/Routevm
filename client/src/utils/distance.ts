// Haversine formula to calculate distance between two points in kilometers
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate cumulative distances from the first valid row
export function calculateCumulativeDistances(rows: any[]): Map<string, number> {
  const distances = new Map<string, number>();

  // Find the first row with valid coordinates as the starting point
  const startRow = rows.find(row =>
    row.latitude && row.longitude &&
    !isNaN(parseFloat(row.latitude)) &&
    !isNaN(parseFloat(row.longitude))
  );

  if (!startRow) {
    console.warn("No valid starting row found with latitude and longitude.");
    return distances;
  }

  distances.set(startRow.id, 0);

  let cumulativeDistance = 0;
  let previousLat = parseFloat(startRow.latitude);
  let previousLon = parseFloat(startRow.longitude);

  // Filter out the start row and sort remaining rows by sortOrder if available
  const routeRows = rows
    .filter(row => row.id !== startRow.id)
    .filter(row => row.latitude && row.longitude &&
                   !isNaN(parseFloat(row.latitude)) &&
                   !isNaN(parseFloat(row.longitude)))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  for (const row of routeRows) {
    const currentLat = parseFloat(row.latitude);
    const currentLon = parseFloat(row.longitude);

    const segmentDistance = calculateDistance(
      previousLat,
      previousLon,
      currentLat,
      currentLon
    );

    cumulativeDistance += segmentDistance;
    distances.set(row.id, cumulativeDistance);

    previousLat = currentLat;
    previousLon = currentLon;
  }

  return distances;
}