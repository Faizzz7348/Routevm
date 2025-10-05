import type { TableRow } from "@shared/schema";

// Default QL Kitchen location
const QL_KITCHEN_LOCATION = {
  latitude: 3.0738,
  longitude: 101.5183,
};

// Constants for calculations
const AVERAGE_SPEED_KMH = 40; // Average driving speed in KL
const FUEL_CONSUMPTION_PER_KM = 0.12; // Liters per km for 1 ton refrigerated lorry (diesel)

interface Location {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  trip?: string;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Calculate total distance for a route
 */
function calculateRouteDistance(
  locations: Location[],
  startLocation: { latitude: number; longitude: number }
): number {
  if (locations.length === 0) return 0;

  let totalDistance = 0;
  let currentLat = startLocation.latitude;
  let currentLon = startLocation.longitude;

  for (const location of locations) {
    const distance = calculateDistance(
      currentLat,
      currentLon,
      location.latitude,
      location.longitude
    );
    totalDistance += distance;
    currentLat = location.latitude;
    currentLon = location.longitude;
  }

  return totalDistance;
}

/**
 * Nearest Neighbor Algorithm - Greedy approach
 * Selects the nearest unvisited location at each step
 */
function nearestNeighborOptimization(
  locations: Location[],
  startLocation: { latitude: number; longitude: number },
  prioritizeTrip: boolean = false
): Location[] {
  if (locations.length === 0) return [];

  const unvisited = [...locations];
  const route: Location[] = [];
  let currentLat = startLocation.latitude;
  let currentLon = startLocation.longitude;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const distance = calculateDistance(
        currentLat,
        currentLon,
        unvisited[i].latitude,
        unvisited[i].longitude
      );

      // Apply trip priority bonus
      let adjustedDistance = distance;
      if (prioritizeTrip && unvisited[i].trip) {
        // Prefer grouping same trip together with 30% distance bonus
        adjustedDistance = distance * 0.7;
      }

      if (adjustedDistance < nearestDistance) {
        nearestDistance = adjustedDistance;
        nearestIndex = i;
      }
    }

    const nearest = unvisited.splice(nearestIndex, 1)[0];
    route.push(nearest);
    currentLat = nearest.latitude;
    currentLon = nearest.longitude;
  }

  return route;
}

/**
 * 2-Opt Algorithm - Local search optimization
 * Improves route by eliminating crossing paths
 */
function twoOptOptimization(route: Location[]): Location[] {
  if (route.length < 4) return route;

  let improved = true;
  let optimizedRoute = [...route];

  while (improved) {
    improved = false;

    for (let i = 0; i < optimizedRoute.length - 2; i++) {
      for (let j = i + 2; j < optimizedRoute.length; j++) {
        // Calculate current distance
        const currentDistance =
          (i > 0
            ? calculateDistance(
                optimizedRoute[i - 1].latitude,
                optimizedRoute[i - 1].longitude,
                optimizedRoute[i].latitude,
                optimizedRoute[i].longitude
              )
            : 0) +
          calculateDistance(
            optimizedRoute[j - 1].latitude,
            optimizedRoute[j - 1].longitude,
            optimizedRoute[j].latitude,
            optimizedRoute[j].longitude
          );

        // Calculate new distance after swap
        const newDistance =
          (i > 0
            ? calculateDistance(
                optimizedRoute[i - 1].latitude,
                optimizedRoute[i - 1].longitude,
                optimizedRoute[j - 1].latitude,
                optimizedRoute[j - 1].longitude
              )
            : 0) +
          calculateDistance(
            optimizedRoute[i].latitude,
            optimizedRoute[i].longitude,
            optimizedRoute[j].latitude,
            optimizedRoute[j].longitude
          );

        if (newDistance < currentDistance) {
          // Reverse the segment between i and j-1
          optimizedRoute = [
            ...optimizedRoute.slice(0, i),
            ...optimizedRoute.slice(i, j).reverse(),
            ...optimizedRoute.slice(j),
          ];
          improved = true;
        }
      }
    }
  }

  return optimizedRoute;
}

/**
 * Genetic Algorithm - Population-based optimization
 */
function geneticAlgorithmOptimization(
  locations: Location[],
  startLocation: { latitude: number; longitude: number },
  prioritizeTrip: boolean = false
): Location[] {
  if (locations.length === 0) return [];
  if (locations.length < 5) {
    // For small routes, use nearest neighbor + 2-opt
    const initial = nearestNeighborOptimization(
      locations,
      startLocation,
      prioritizeTrip
    );
    return twoOptOptimization(initial);
  }

  const POPULATION_SIZE = 50;
  const GENERATIONS = 100;
  const MUTATION_RATE = 0.1;
  const ELITE_SIZE = 5;

  // Create initial population
  let population: Location[][] = [];

  // Add nearest neighbor solution as seed
  population.push(
    nearestNeighborOptimization(locations, startLocation, prioritizeTrip)
  );

  // Generate random solutions
  for (let i = 1; i < POPULATION_SIZE; i++) {
    const shuffled = [...locations].sort(() => Math.random() - 0.5);
    population.push(shuffled);
  }

  // Evolution loop
  for (let gen = 0; gen < GENERATIONS; gen++) {
    // Calculate fitness (inverse of distance)
    const fitness = population.map((route) => {
      const distance = calculateRouteDistance(route, startLocation);
      return 1 / (distance + 1);
    });

    // Selection - keep elite
    const sortedIndices = fitness
      .map((f, i) => ({ fitness: f, index: i }))
      .sort((a, b) => b.fitness - a.fitness);

    const newPopulation: Location[][] = [];

    // Keep elite
    for (let i = 0; i < ELITE_SIZE; i++) {
      newPopulation.push([...population[sortedIndices[i].index]]);
    }

    // Crossover and mutation
    while (newPopulation.length < POPULATION_SIZE) {
      // Tournament selection
      const parent1 =
        population[
          sortedIndices[Math.floor(Math.random() * POPULATION_SIZE / 2)].index
        ];
      const parent2 =
        population[
          sortedIndices[Math.floor(Math.random() * POPULATION_SIZE / 2)].index
        ];

      // Order crossover
      const child = orderCrossover(parent1, parent2);

      // Mutation
      if (Math.random() < MUTATION_RATE) {
        swapMutation(child);
      }

      newPopulation.push(child);
    }

    population = newPopulation;
  }

  // Return best solution
  const finalFitness = population.map((route) => {
    const distance = calculateRouteDistance(route, startLocation);
    return 1 / (distance + 1);
  });

  const bestIndex = finalFitness.indexOf(Math.max(...finalFitness));
  return population[bestIndex];
}

/**
 * Order Crossover for genetic algorithm
 */
function orderCrossover(parent1: Location[], parent2: Location[]): Location[] {
  const size = parent1.length;
  const start = Math.floor(Math.random() * size);
  const end = Math.floor(Math.random() * (size - start)) + start;

  const child: Location[] = new Array(size);

  // Copy segment from parent1
  for (let i = start; i <= end; i++) {
    child[i] = parent1[i];
  }

  // Fill remaining from parent2
  let currentIndex = (end + 1) % size;
  for (let i = 0; i < size; i++) {
    const parent2Index = (end + 1 + i) % size;
    const location = parent2[parent2Index];

    if (!child.includes(location)) {
      child[currentIndex] = location;
      currentIndex = (currentIndex + 1) % size;
    }
  }

  return child;
}

/**
 * Swap mutation for genetic algorithm
 */
function swapMutation(route: Location[]): void {
  const i = Math.floor(Math.random() * route.length);
  const j = Math.floor(Math.random() * route.length);
  [route[i], route[j]] = [route[j], route[i]];
}

/**
 * Simulated Annealing Algorithm - Probabilistic optimization
 */
function simulatedAnnealingOptimization(
  locations: Location[],
  startLocation: { latitude: number; longitude: number },
  prioritizeTrip: boolean = false
): Location[] {
  if (locations.length === 0) return [];

  // Start with nearest neighbor solution
  let currentRoute = nearestNeighborOptimization(
    locations,
    startLocation,
    prioritizeTrip
  );
  let currentDistance = calculateRouteDistance(currentRoute, startLocation);

  let bestRoute = [...currentRoute];
  let bestDistance = currentDistance;

  // Simulated annealing parameters
  let temperature = 1000;
  const coolingRate = 0.995;
  const minTemperature = 1;

  while (temperature > minTemperature) {
    // Generate neighbor solution by swapping two random locations
    const newRoute = [...currentRoute];
    const i = Math.floor(Math.random() * newRoute.length);
    const j = Math.floor(Math.random() * newRoute.length);
    [newRoute[i], newRoute[j]] = [newRoute[j], newRoute[i]];

    const newDistance = calculateRouteDistance(newRoute, startLocation);
    const delta = newDistance - currentDistance;

    // Accept better solutions or worse solutions with probability
    if (delta < 0 || Math.random() < Math.exp(-delta / temperature)) {
      currentRoute = newRoute;
      currentDistance = newDistance;

      if (currentDistance < bestDistance) {
        bestRoute = [...currentRoute];
        bestDistance = currentDistance;
      }
    }

    temperature *= coolingRate;
  }

  return bestRoute;
}

/**
 * Main optimization function
 */
export function optimizeRoute(
  rows: TableRow[],
  algorithm: "nearest_neighbor" | "genetic" | "simulated_annealing" = "nearest_neighbor",
  startLocation: { latitude: number; longitude: number } = QL_KITCHEN_LOCATION,
  prioritizeTrip: boolean = false
) {
  // Filter rows with valid coordinates
  const locationsWithData = rows
    .filter(
      (row) =>
        row.latitude &&
        row.longitude &&
        parseFloat(row.latitude) !== 0 &&
        parseFloat(row.longitude) !== 0
    )
    .map((row) => ({
      id: row.id,
      latitude: parseFloat(row.latitude!),
      longitude: parseFloat(row.longitude!),
      name: row.location || "Unknown",
      trip: row.trip,
    }));

  if (locationsWithData.length === 0) {
    throw new Error("No valid locations with coordinates found");
  }

  // Calculate original order distance
  const originalDistance = calculateRouteDistance(
    locationsWithData,
    startLocation
  );

  // Run optimization based on selected algorithm
  let optimizedLocations: Location[];

  switch (algorithm) {
    case "genetic":
      optimizedLocations = geneticAlgorithmOptimization(
        locationsWithData,
        startLocation,
        prioritizeTrip
      );
      break;
    case "simulated_annealing":
      optimizedLocations = simulatedAnnealingOptimization(
        locationsWithData,
        startLocation,
        prioritizeTrip
      );
      break;
    case "nearest_neighbor":
    default:
      const initial = nearestNeighborOptimization(
        locationsWithData,
        startLocation,
        prioritizeTrip
      );
      optimizedLocations = twoOptOptimization(initial);
      break;
  }

  // Calculate optimized distance
  const optimizedDistance = calculateRouteDistance(
    optimizedLocations,
    startLocation
  );

  // Calculate savings
  const distanceSaved = originalDistance - optimizedDistance;
  const timeSaved = (distanceSaved / AVERAGE_SPEED_KMH) * 60; // in minutes
  const fuelSaved = distanceSaved * FUEL_CONSUMPTION_PER_KM; // in liters

  return {
    originalOrder: locationsWithData.map((l) => l.id),
    optimizedOrder: optimizedLocations.map((l) => l.id),
    originalDistance: parseFloat(originalDistance.toFixed(2)),
    optimizedDistance: parseFloat(optimizedDistance.toFixed(2)),
    distanceSaved: parseFloat(distanceSaved.toFixed(2)),
    timeSaved: parseFloat(timeSaved.toFixed(2)),
    fuelSaved: parseFloat(fuelSaved.toFixed(2)),
    algorithm,
    optimizationFactors: {
      distanceReduction: parseFloat(
        ((distanceSaved / originalDistance) * 100).toFixed(2)
      ),
      timeEfficiency: parseFloat(timeSaved.toFixed(2)),
      fuelEfficiency: parseFloat(fuelSaved.toFixed(2)),
    },
  };
}
