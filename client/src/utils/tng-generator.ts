// Touch n Go value generator utilities

const TNG_SITES = [
  "TnG KL Central",
  "TnG Petaling Jaya",
  "TnG Shah Alam",
  "TnG Subang Jaya",
  "TnG Damansara",
  "TnG Mont Kiara",
  "TnG KLCC",
  "TnG Bukit Bintang",
  "TnG Cheras",
  "TnG Ampang",
  "TnG Kepong",
  "TnG Wangsa Maju",
  "TnG Setapak",
  "TnG Sentul",
  "TnG Brickfields"
];

const ROUTE_ORIGINS = [
  "Central",
  "North",
  "South", 
  "East",
  "West",
  "Northeast",
  "Southeast",
  "Northwest",
  "Southwest"
];

const ROUTE_DESTINATIONS = [
  "Central",
  "North", 
  "South",
  "East",
  "West",
  "Northeast",
  "Southeast", 
  "Northwest",
  "Southwest"
];

// Generate random TnG Site name
export function generateTngSite(): string {
  const randomIndex = Math.floor(Math.random() * TNG_SITES.length);
  return TNG_SITES[randomIndex];
}

// Generate random TnG currency amount
export function generateTngRoute(): string {
  // Generate random currency amounts between 5.00 and 50.00 MYR
  const minAmount = 5.00;
  const maxAmount = 50.00;
  const randomAmount = Math.random() * (maxAmount - minAmount) + minAmount;
  
  // Round to 2 decimal places and return as string
  return randomAmount.toFixed(2);
}

// Generate both TnG values at once
export function generateTngValues(): { tngSite: string; tngRoute: string } {
  return {
    tngSite: generateTngSite(),
    tngRoute: generateTngRoute()
  };
}