import { Pieces } from './pieces.enum';
import { Colors } from './colors.enum';
import { Move } from './move.model';

export type BoardMap = Map<number, [Pieces, Colors]>;

export interface GameState {
  board: BoardMap;
  active: Colors;

  availableMoves: Move[];

  selectedSquare?: { rank: number, file: number } | null;
}
