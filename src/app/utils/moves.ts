import { HistoryMove, Move, MoveActions } from '../models/move.model';
import { BoardMap } from '../models/game-state.model';
import { Pieces } from '../models/pieces.enum';
import { Colors } from '../models/colors.enum';
import { rankAndFile, squareNumber } from './board';

enum Directions {
  North,
  South,
  East,
  West,
}

function generateHistoryMoveEntry(history: HistoryMove[],
  board: BoardMap,
  from: number,
  to: number,
  action: MoveActions): HistoryMove {
  const last = history[history.length - 1];

  return {
    count: !!last ? last.count + 1 : 1,
    from,
    to,
    action,
    state: board,
  };
}

function calculateBishopMoves(board: BoardMap,
  color: Colors,
  rank: number,
  file: number,
  squareNum: number,
  once = false): Move[] {
  let deltas: number[] = [];
  const moves: Move[] = [];

  if (file !== 1) {
    deltas.push(-9, 7);
  }
  if (file !== 8) {
    deltas.push(-7, 9);
  }
  if (rank === 1) {
    deltas = deltas.filter(delta => delta > 0);
  }
  if (rank === 8) {
    deltas = deltas.filter(delta => delta < 0);
  }

  deltas.forEach(delta => {
    let newSquareNum = squareNum + delta;
    let newSquare = rankAndFile(newSquareNum);

    while (!!newSquare) {
      const square = board.get(newSquareNum);

      if (!square) {
        moves.push({
          square: newSquareNum,
          action: MoveActions.Move,
        });
      } else if (square[1] !== color) {
        moves.push({
          square: newSquareNum,
          action: MoveActions.Capture,
        });
        break;
      } else {
        break;
      }

      if (newSquare.rank === 1
        || newSquare.rank === 8
        || newSquare.file === 1
        || newSquare.file === 8
        || once) {
        break;
      }

      newSquareNum = newSquareNum + delta;
      newSquare = rankAndFile(newSquareNum);
    }
  });

  return moves;
}


export function calculateLegalMoves(board: BoardMap,
  history: HistoryMove[],
  rank: number,
  file: number,
  fullDepth = true): Move[] {
  const squareNum = squareNumber(rank, file);
  const [piece, color] = board.get(squareNum)!;

  let moves: Move[] = [];

  switch (piece) {
    case Pieces.Bishop:
      moves = calculateBishopMoves(board, color, rank, file, squareNum);
      break;
  }
  return moves;
}

export function makeMove(board: BoardMap,
  availableMoves: Move[],
  history: HistoryMove[],
  color: Colors,
  toMoveSquareNum: number,
  prevSelectedSquare: { rank: number, file: number })
  : { board: BoardMap, entry: HistoryMove } {
  const prevSquare = squareNumber(
    prevSelectedSquare.rank,
    prevSelectedSquare.file,
  );
  const { action } = availableMoves
    .find(move => move.square === toMoveSquareNum)!;

  const newBoard = new Map(board);

  newBoard.delete(prevSquare);
  newBoard.set(toMoveSquareNum, board.get(prevSquare)!);

  switch (action) {
    case MoveActions.EnPassant: {
      const delta = color === Colors.White ? 8 : -8;
      newBoard.delete(toMoveSquareNum + delta);
      break;
    }
    case MoveActions.ShortCastle: {
      const rookSquareNum = color === Colors.White ? 64 : 8;
      const rook = newBoard.get(rookSquareNum)!;
      newBoard.set(rookSquareNum - 2, rook);
      newBoard.delete(rookSquareNum);
      break;
    }
    case MoveActions.LongCastle: {
      const rookSquareNum = color === Colors.White ? 57 : 1;
      const rook = newBoard.get(rookSquareNum)!;
      newBoard.set(rookSquareNum + 3, rook);
      newBoard.delete(rookSquareNum);
      break;
    }
  }

  const entry = generateHistoryMoveEntry(
    history,
    newBoard,
    prevSquare,
    toMoveSquareNum,
    action,
  );

  return { board: newBoard, entry };
}

export function promote(board: BoardMap,
  history: HistoryMove[],
  squareNum: number,
  piece: Pieces)
  : { board: BoardMap, entry: HistoryMove } {
  const newBoard = new Map(board);

  newBoard.set(squareNum, [piece, newBoard.get(squareNum)![1]]);

  const entry = generateHistoryMoveEntry(
    history,
    newBoard,
    squareNum,
    squareNum,
    MoveActions.Promote,
  );

  return { board: newBoard, entry };
}
