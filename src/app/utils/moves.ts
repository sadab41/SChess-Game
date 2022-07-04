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

function calculatePawnMoves(board: BoardMap,
                            history: HistoryMove[],
                            color: Colors,
                            rank: number,
                            file: number,
                            squareNum: number): Move[] {
  const initialRank = color === Colors.White ? 7 : 2;
  const delta = color === Colors.White ? -8 : 8;
  const captureDeltas: number[] = [];
  const moves: Move[] = [];

  if (file !== 1) {
    captureDeltas.push(color === Colors.White ? -9 : 7);
  }
  if (file !== 8) {
    captureDeltas.push(color === Colors.White ? -7 : 9);
  }

  if (!board.has(squareNum + delta)) {
    moves.push({
      square: squareNum + delta,
      action: MoveActions.Move,
    });

    if (rank === initialRank && !board.has(squareNum + 2 * delta)) {
      moves.push({
        square: squareNum + 2 * delta,
        action: MoveActions.Move,
      });
    }
  }

  captureDeltas.forEach(captureDelta => {
    const square = board.get(squareNum + captureDelta);

    if (!!square && square[1] !== color) {
      moves.push({
        square: squareNum + captureDelta,
        action: MoveActions.Capture,
      });
    }
  });

  const lastEntry = history[history.length - 1];
  if (!!lastEntry
    && board.get(lastEntry.to)?.[0] === Pieces.Pawn
    && Math.abs(lastEntry.to - lastEntry.from) === 16
    && rankAndFile(lastEntry.to)?.rank === rank) {
    moves.push({
      square: lastEntry.to + (color === Colors.White ? -8 : 8),
      action: MoveActions.EnPassant,
    });
  }

  return moves;
}

function calculateKnightMoves(board: BoardMap,
                              color: Colors,
                              rank: number,
                              file: number,
                              squareNum: number): Move[] {
  let deltas: number[] = [];
  const moves: Move[] = [];

  if (file !== 1) {
    deltas.push(-17, 15);

    if (file !== 2) {
      deltas.push(-10, 6);
    }
  }
  if (file !== 8) {
    deltas.push(-15, 17);

    if (file !== 7) {
      deltas.push(-6, 10);
    }
  }
  if (rank === 1) {
    deltas = deltas.filter(delta => delta > 0);
  } else if (rank === 2) {
    deltas = deltas.filter(delta => delta !== -17 && delta !== -15);
  } else if (rank === 8) {
    deltas = deltas.filter(delta => delta < 0);
  } else if (rank === 7) {
    deltas = deltas.filter(delta => delta !== 15 && delta !== 17);
  }

  deltas.forEach(delta => {
    const newSquareNum = squareNum + delta;
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
    }
  });

  return moves;
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

function calculateRookMoves(board: BoardMap,
                            color: Colors,
                            rank: number,
                            file: number,
                            squareNum: number,
                            once = false): Move[] {
  const deltas: { delta: number, direction: Directions }[] = [];

  if (rank !== 1) {
    deltas.push({ delta: -8, direction: Directions.North });
  }
  if (rank !== 8) {
    deltas.push({ delta: 8, direction: Directions.South });
  }
  if (file !== 1) {
    deltas.push({ delta: -1, direction: Directions.West });
  }
  if (file !== 8) {
    deltas.push({ delta: 1, direction: Directions.East });
  }

  const moves: Move[] = [];

  deltas.forEach(({ delta, direction }) => {
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

      let shouldBreak: boolean;
      switch (direction) {
        case Directions.North:
          shouldBreak = newSquare.rank === 1;
          break;
        case Directions.South:
          shouldBreak = newSquare.rank === 8;
          break;
        case Directions.East:
          shouldBreak = newSquare.file === 8;
          break;
        case Directions.West:
          shouldBreak = newSquare.file === 1;
          break;
      }

      if (shouldBreak || once) {
        break;
      }

      newSquareNum = newSquareNum + delta;
      newSquare = rankAndFile(newSquareNum);
    }
  });

  return moves;
}

function calculateQueenMoves(board: BoardMap,
                             color: Colors,
                             rank: number,
                             file: number,
                             squareNum: number): Move[] {
  const b = calculateBishopMoves(board, color, rank, file, squareNum);
  const r = calculateRookMoves(board, color, rank, file, squareNum);

  return [...b, ...r];
}

function calculateKingMoves(board: BoardMap,
                            color: Colors,
                            rank: number,
                            file: number,
                            squareNum: number): Move[] {
  const b = calculateBishopMoves(board, color, rank, file, squareNum, true);
  const r = calculateRookMoves(board, color, rank, file, squareNum, true);

  return [...b, ...r];
}

function filterPseudoLegalMoves(board: BoardMap,
                                color: Colors,
                                moves: Move[],
                                toMoveSquare: { rank: number, file: number })
  : Move[] {
  const oppositeColor = color === Colors.White ? Colors.Black : Colors.White;

  return moves.filter(move => {
    const { board: newBoard } = makeMove(
      board,
      [move],
      [],
      color,
      move.square,
      toMoveSquare,
    );

    let kingSquareNum: number;
    for (const [key, square] of newBoard) {
      if (!!square && square[0] === Pieces.King && square[1] === color) {
        kingSquareNum = key;
      }
    }

    let isIllegal = false;
    for (const [key, square] of newBoard) {
      if (!!square && square?.[1] === oppositeColor) {
        if (key < 1 || key > 64) {
          console.log(key, square);
        }

        const { rank, file } = rankAndFile(key)!;
        const aheadMoves = calculateLegalMoves(
          newBoard,
          [],
          rank,
          file,
          false,
        );

        if (aheadMoves.some(aheadMove => aheadMove.square === kingSquareNum)) {
          isIllegal = true;
        }
      }
    }

    return !isIllegal;
  });
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
    case Pieces.Pawn:
      moves = calculatePawnMoves(board, history, color, rank, file, squareNum);
      break;
    case Pieces.Knight:
      moves = calculateKnightMoves(board, color, rank, file, squareNum);
      break;
    case Pieces.Bishop:
      moves = calculateBishopMoves(board, color, rank, file, squareNum);
      break;
    case Pieces.Rook:
      moves = calculateRookMoves(board, color, rank, file, squareNum);
      break;
    case Pieces.Queen:
      moves = calculateQueenMoves(board, color, rank, file, squareNum);
      break;
    case Pieces.King:
      moves = calculateKingMoves(board, color, rank, file, squareNum);
      break;
  }

  if (fullDepth) {
    moves = filterPseudoLegalMoves(board, color, moves, { rank, file });
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
  const prevSquare
    = squareNumber(prevSelectedSquare.rank, prevSelectedSquare.file);
  const { action } = availableMoves
    .find(move => move.square === toMoveSquareNum)!;

  const newBoard = new Map(board);

  newBoard.delete(prevSquare);
  newBoard.set(toMoveSquareNum, board.get(prevSquare)!);

  if (action === MoveActions.EnPassant) {
    const delta = color === Colors.White ? 8 : -8;
    newBoard.delete(toMoveSquareNum + delta);
  }

  const last = history[history.length - 1];
  const entry: HistoryMove = {
    count: !!last ? last.count + 1 : 1,
    from: prevSquare,
    to: toMoveSquareNum,
    action,
  };

  return { board: newBoard, entry };
}
