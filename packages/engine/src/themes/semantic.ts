/** Colors with a fixed meaning, shared by every theme. */
export interface SemanticColors {
  /** Good things: pros, checks. */
  readonly positive: string;
  /** Bad things: cons. */
  readonly negative: string;
  /** Celebration sparks and confetti, next to the accent and white. */
  readonly spark: string;
}

export const SEMANTIC_COLORS: SemanticColors = {
  positive: '#22C55E',
  negative: '#EF4444',
  spark: '#FFD43B',
};
