// Loyalty points: 1 point per R1 spent
export const POINTS_PER_RAND = 1;
export const POINTS_VALUE_RAND = 0.1; // R0.10 per point
export const MIN_REDEEM_POINTS = 500; // Minimum 500 points to redeem (= R50)

export function calculatePoints(orderTotal: number): number {
  return Math.floor(orderTotal * POINTS_PER_RAND);
}

export function pointsToRand(points: number): number {
  return points * POINTS_VALUE_RAND;
}

export function formatPoints(points: number): string {
  return `${points.toLocaleString("en-ZA")} pts`;
}