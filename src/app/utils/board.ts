import { Colors } from '../models/colors.enum';

export function getSquareColor(rank: number, file: number): Colors {
  return (file + rank) % 2 === 0 ? Colors.White : Colors.Black;
}
