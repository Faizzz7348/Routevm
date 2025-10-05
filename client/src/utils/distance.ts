import tablerows from '../data/tablerow.json';
import { calculateCumulativeDistances, calculateDistance } from './distance';

/**
 * Calculates the distance between two coordinates using the Haversine formula.
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (value: number) => value * Math.PI / 180;
  const R = 6371; // Earth's radius in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

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

    const segmentDistance = getDistanceKm(
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

export { getDistanceKm as calculateDistance };

// Calculate cumulative distances for your route rows
const distances = calculateCumulativeDistances(tablerows);

// Calculate direct distance between two points
const km = calculateDistance(3.139, 101.6869, 3.0738, 101.5183);

console.log('Cumulative distances:', distances);
console.log('Direct distance:', km);