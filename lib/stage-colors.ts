// Une couleur par étape (1..7) — désaturées pour rester lisibles sur carte.
export const STAGE_COLORS = [
  "#C25E4C",
  "#4C7DC2",
  "#4C9B6E",
  "#B0813E",
  "#7C5EC2",
  "#C24C8A",
  "#3E9BB0",
];

export function stageColor(n: number): string {
  return STAGE_COLORS[(n - 1 + STAGE_COLORS.length) % STAGE_COLORS.length];
}
