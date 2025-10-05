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

// Calculate cumulative distances from QL Kitchen through the route
export function calculateCumulativeDistances(rows: any[]): Map<string, number> {
  const distances = new Map<string, number>();
  
  // Find QL Kitchen (warehouse) row
  const qlKitchen = rows.find(row => row.route === "Warehouse" && row.sortOrder === -1);
  
  if (!qlKitchen || !qlKitchen.latitude || !qlKitchen.longitude) {
    // If no QL Kitchen found, return empty distances
    return distances;
  }

  // QL Kitchen has 0 distance
  distances.set(qlKitchen.id, 0);

  // Filter out QL Kitchen and sort remaining rows by their current order
  const routeRows = rows
    .filter(row => row.id !== qlKitchen.id)
    .filter(row => row.latitude && row.longitude && 
                   !isNaN(parseFloat(row.latitude)) && 
                   !isNaN(parseFloat(row.longitude)));

  let cumulativeDistance = 0;
  let previousLat = parseFloat(qlKitchen.latitude);
  let previousLon = parseFloat(qlKitchen.longitude);

  for (const row of routeRows) {
    const currentLat = parseFloat(row.latitude);
    const currentLon = parseFloat(row.longitude);
    
    // Calculate distance from previous point to current point
    const segmentDistance = calculateDistance(
      previousLat,
      previousLon,
      currentLat,
      currentLon
    );
    
    cumulativeDistance += segmentDistance;
    distances.set(row.id, cumulativeDistance);
    
    // Update previous coordinates for next iteration
    previousLat = currentLat;
    previousLon = currentLon;
  }

  return distances;
}