/**
 * Trail connectivity data — parks that physically connect to each other.
 * Maps park ID → array of connected park IDs.
 */
const CONNECTIONS: Record<string, string[]> = {
  // North Shore network
  'willowdale': ['georgetown-rowley', 'bradley-palmer'],
  'georgetown-rowley': ['willowdale', 'bradley-palmer'],
  'bradley-palmer': ['willowdale', 'georgetown-rowley'],
  // MetroWest Trustees
  'noanet-woodlands': ['hale-reservation'],
  'hale-reservation': ['noanet-woodlands'],
  // South Shore
  'whitney-thayer': ['wompatuck'],
  'wompatuck': ['whitney-thayer'],
  // Cape Cod
  'nickerson': ['punkhorn'],
  'punkhorn': ['nickerson'],
  // NJ/NY border
  'ringwood': ['sterling-forest'],
  'sterling-forest': ['ringwood'],
  // Willow Street complex
  'willow-street': ['beebe-woods'],
};

export function getConnectedParks(parkId: string): string[] {
  return CONNECTIONS[parkId] ?? [];
}
