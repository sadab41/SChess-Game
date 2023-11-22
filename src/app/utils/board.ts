import { Colors } from '../models/colors.enum';
import { Pieces } from '../models/pieces.enum';
import { BoardMap } from '../models/game-state.model';

export const boardInitialPosition: BoardMap
  = new Map<number, [Pieces, Colors]>([
    [3, [Pieces.Bishop, Colors.Black]],
    [6, [Pieces.Bishop, Colors.Black]],
    [59, [Pieces.Bishop, Colors.White]],
    [62, [Pieces.Bishop, Colors.White]],
  ]);

export function squareColor(rank: number, file: number): Colors {
  return (file + rank) % 2 === 0 ? Colors.White : Colors.Black;
}

export function squareNumber(rank: number, file: number): number {
  return (rank - 1) * 8 + file;
}

export function rankAndFile(squareNum: number)
  : { rank: number, file: number } | null {
  for (let r = 1; r <= 8; r++) {
    const f = squareNum + 8 - 8 * r;
    if (f >= 1 && f <= 8 && Number.isInteger(f)) {
      return { rank: r, file: f };
    }
  }

  return null;
}
