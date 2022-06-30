import { Injectable } from '@angular/core';

import { BehaviorSubject, map, Observable, pluck } from 'rxjs';

import { BoardMap, GameState } from '../models/game-state.model';
import { Colors } from '../models/colors.enum';
import { Pieces } from '../models/pieces.enum';
import { Move, MoveActions } from '../models/move.model';
import {
  boardInitialPosition,
  rankAndFile,
  squareNumber,
} from '../utils/board';

@Injectable({ providedIn: 'root' })
export class GameService {
  private gameStateSubject = new BehaviorSubject<GameState>({
    board: boardInitialPosition,
    active: Colors.White,
    availableMoves: [],
  });

  get activeColor$(): Observable<Colors> {
    return this.gameStateSubject.asObservable()
      .pipe(pluck('active'));
  }

  get selectedSquare$()
    : Observable<{ rank: number, file: number } | null | undefined> {
    return this.gameStateSubject.asObservable()
      .pipe(pluck('selectedSquare'));
  }

  get availableMoves$(): Observable<Move[]> {
    return this.gameStateSubject.asObservable()
      .pipe(pluck('availableMoves'));
  }

  selectSquare(rank: number, file: number): void {
    const { board, active, availableMoves } = this.gameStateSubject.value;
    const squareNum = squareNumber(rank, file);

    let square: { rank: number, file: number } | null = null;

    if (!!availableMoves?.length
      && availableMoves.some(move => move.square === squareNum)) {
      this.makeMove(board, active, squareNum);
    } else if (board.has(squareNum) && board.get(squareNum)?.[1] === active) {
      square = { rank, file };

      this.calculateLegalMoves(board, rank, file, squareNum);
    } else {
      this.updateAvailableMoves([]);
    }

    this.gameStateSubject.next({
      ...this.gameStateSubject.value,
      selectedSquare: square,
    });
  }

  getPieceInSquare$(square: number): Observable<[Pieces, Colors] | undefined>;
  getPieceInSquare$(rank: number, file: number)
    : Observable<[Pieces, Colors] | undefined>;
  getPieceInSquare$(a: number, b?: number)
    : Observable<[Pieces, Colors] | undefined> {
    const square = !!b ? squareNumber(a, b) : a;

    return this.gameStateSubject.asObservable()
      .pipe(map(({ board }) => board.get(square)));
  }

  private updateAvailableMoves(moves: Move[]): void {
    this.gameStateSubject.next({
      ...this.gameStateSubject.value,
      availableMoves: moves,
    });
  }

  private makeMove(board: BoardMap, active: Colors, squareNum: number): void {
    const selected = this.gameStateSubject.value.selectedSquare;

    if (!!selected) {
      const prevSquareNum = squareNumber(selected.rank, selected.file);
      const square = board.get(prevSquareNum)!;
      const newBoard = new Map(board);

      newBoard.delete(squareNumber(selected.rank, selected.file));
      newBoard.set(squareNum, square);

      this.gameStateSubject.next({
        ...this.gameStateSubject.value,
        board: newBoard,
        active: active === Colors.White ? Colors.Black : Colors.White,
        availableMoves: [],
      });
    }
  }

  private calculateLegalMoves(board: BoardMap,
                              rank: number,
                              file: number,
                              squareNum: number): void {
    const square = board.get(squareNum);

    if (!square) {
      return;
    }

    const [piece, color] = square;
    let moves: Move[] = [];

    switch (piece) {
      case Pieces.Pawn:
        moves = this.calculatePawnMoves(board, rank, squareNum, color);
        break;
      case Pieces.Knight:
        moves = this.calculateKnightMoves(board, rank, file, squareNum, color);
        break;
      case Pieces.Bishop:
        moves = this.calculateBishopMoves(board, file, squareNum, color);
        break;
      case Pieces.Rook:
        moves = this.calculateRookMoves(board, rank, file, squareNum, color);
        break;
      case Pieces.Queen:
        const b = this.calculateBishopMoves(board, file, squareNum, color);
        const r = this.calculateRookMoves(board, rank, file, squareNum, color);
        moves = [...b, ...r];
        break;
      case Pieces.King:
        moves = this.calculateKingMoves(board, squareNum, color);
        break;
    }

    this.gameStateSubject.next({
      ...this.gameStateSubject.value,
      availableMoves: moves,
    });
  }

  private calculatePawnMoves(board: BoardMap,
                             rank: number,
                             squareNum: number,
                             color: Colors): Move[] {
    const delta = color === Colors.White ? -8 : 8;
    const captureDelta = color === Colors.White ? [-7, -9] : [7, 9];
    const initialRank = color === Colors.White ? 7 : 2;
    const moves: Move[] = [];

    if (!board.has(squareNum + delta)) {
      moves.push({ square: squareNum + delta, action: MoveActions.Move });

      if (!board.has(squareNum + 2 * delta) && rank === initialRank) {
        moves.push({ square: squareNum + 2 * delta, action: MoveActions.Move });
      }
    }
    if (board.has(squareNum + captureDelta[0])
      && board.get(squareNum + captureDelta[0])?.[1] !== color) {
      moves.push({
        square: squareNum + captureDelta[0],
        action: MoveActions.Capture,
      });
    }
    if (board.has(squareNum + captureDelta[1])
      && board.get(squareNum + captureDelta[1])?.[1] !== color) {
      moves.push({
        square: squareNum + captureDelta[1],
        action: MoveActions.Capture,
      });
    }

    return moves;
  }

  private calculateKnightMoves(board: BoardMap,
                               rank: number,
                               file: number,
                               squareNum: number,
                               color: Colors): Move[] {
    const deltas = [-17, -15, -10, -6, 6, 10, 15, 17];
    const moves: Move[] = [];

    deltas.forEach(delta => {
      const newSquareNum = squareNum + delta;
      const newSquare = rankAndFile(newSquareNum);

      if (!!newSquare
        && Math.abs(newSquare.rank - rank) <= 2
        && Math.abs(newSquare.file - file) <= 2) {
        const square = board.get(newSquareNum);

        if (!square) {
          moves.push({ square: newSquareNum, action: MoveActions.Move });
        } else if (square[1] !== color) {
          moves.push({ square: newSquareNum, action: MoveActions.Capture });
        }
      }
    });

    return moves;
  }

  private calculateBishopMoves(board: BoardMap,
                               file: number,
                               squareNum: number,
                               color: Colors): Move[] {
    const deltas = [
      ...(file !== 1 ? [-9, 7] : []),
      ...(file !== 8 ? [-7, 9] : []),
    ];
    const moves: Move[] = [];

    deltas.forEach(delta => {
      let newSquareNum = squareNum + delta;
      let newSquare = rankAndFile(newSquareNum);

      while (!!newSquare) {
        const square = board.get(newSquareNum);

        if (!square) {
          moves.push({ square: newSquareNum, action: MoveActions.Move });
        } else if (square[1] !== color) {
          moves.push({ square: newSquareNum, action: MoveActions.Capture });
          break;
        } else {
          break;
        }

        if (newSquare.file === 1 || newSquare.file === 8) {
          break;
        }

        newSquareNum = newSquareNum + delta;
        newSquare = rankAndFile(newSquareNum);
      }
    });

    return moves;
  }

  private calculateRookMoves(board: BoardMap,
                             rank: number,
                             file: number,
                             squareNum: number,
                             color: Colors): Move[] {
    const deltas: { delta: number, direction: 'n' | 's' | 'e' | 'w' }[] = [];

    if (rank !== 1) {
      deltas.push({ delta: -8, direction: 'n' });
    }
    if (rank !== 8) {
      deltas.push({ delta: 8, direction: 's' });
    }
    if (file !== 1) {
      deltas.push({ delta: -1, direction: 'w' });
    }
    if (file !== 8) {
      deltas.push({ delta: 1, direction: 'e' });
    }

    const moves: Move[] = [];

    deltas.forEach(({ delta, direction }) => {
      let newSquareNum = squareNum + delta;
      let newSquare = rankAndFile(newSquareNum);

      while (!!newSquare) {
        const square = board.get(newSquareNum);

        if (!square) {
          moves.push({ square: newSquareNum, action: MoveActions.Move });
        } else if (square[1] !== color) {
          moves.push({ square: newSquareNum, action: MoveActions.Capture });
          break;
        } else {
          break;
        }

        let shouldBreak: boolean;
        switch (direction) {
          case 'n':
            shouldBreak = newSquare.rank === 1;
            break;
          case 's':
            shouldBreak = newSquare.rank === 8;
            break;
          case 'e':
            shouldBreak = newSquare.file === 8;
            break;
          case 'w':
            shouldBreak = newSquare.file === 1;
            break;
        }

        if (shouldBreak) {
          break;
        }

        newSquareNum = newSquareNum + delta;
        newSquare = rankAndFile(newSquareNum);
      }
    });

    return moves;
  }

  private calculateKingMoves(board: BoardMap,
                             squareNum: number,
                             color: Colors): Move[] {
    const deltas = [-9, -8, -7, -1, 1, 7, 8, 9];

    const moves: Move[] = [];

    deltas.forEach(delta => {
      const newSquareNum = squareNum + delta;
      const square = board.get(newSquareNum);

      if (!square) {
        moves.push({ square: newSquareNum, action: MoveActions.Move });
      } else if (square[1] !== color) {
        moves.push({ square: newSquareNum, action: MoveActions.Capture });
      }
    });

    return moves;
  }
}
