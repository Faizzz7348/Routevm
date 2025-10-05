import tablerows from '../data/tablerow.json';
import { calculateCumulativeDistances, calculateDistance } from './distance';
npm install -g ts-node typescript
// Validate that tablerows is a non-empty array
if (!Array.isArray(tablerows) || tablerows.length === 0) {
  console.error('tablerow.json must export a non-empty array of rows.');
} else {
  // Filter out rows missing latitude or longitude
  const validRows = tablerows.filter(row =>
    row.latitude && row.longitude &&
    !isNaN(parseFloat(row.latitude)) &&
    !isNaN(parseFloat(row.longitude))
  );

  if (validRows.length === 0) {
    console.error('No valid rows with latitude and longitude found.');
  } else {
    // Calculate cumulative distances for valid route rows
    const distances = calculateCumulativeDistances(validRows);

    // Log each row's cumulative distance
    for (const [id, km] of distances.entries()) {
      console.log(`Row ID: ${id}, Cumulative Distance: ${km.toFixed(2)} km`);
    }

    // Example: Calculate direct distance between two points
    const kmDirect = calculateDistance(3.139, 101.6869, 3.0738, 101.5183);
    console.log('Direct distance between example points:', kmDirect.toFixed(2), 'km');
  }
}