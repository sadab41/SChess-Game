import { Pieces } from './pieces.enum';
import { Colors } from './colors.enum';

export interface GameState {
  board: Map<number, [Pieces, Colors]>;
  active: Colors;

  selectedSquare?: { rank: number, file: number } | null;
}
