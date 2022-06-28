import { Injectable } from '@angular/core';

import { BehaviorSubject, map, Observable, pluck } from 'rxjs';

import { BoardMap, GameState } from '../models/game-state.model';
import { Colors } from '../models/colors.enum';
import { Pieces } from '../models/pieces.enum';
import { Move, MoveActions } from '../models/move.model';
import { boardInitialPosition, squareNumber } from '../utils/board';

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
    const { board, active } = this.gameStateSubject.value;
    const squareNum = squareNumber(rank, file);

    let square: { rank: number, file: number } | null = null;

    if (board.has(squareNum) && board.get(squareNum)?.[1] === active) {
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

  private calculateLegalMoves(board: BoardMap,
                              rank: number,
                              file: number,
                              squareNum: number): void {
    const square = board.get(squareNum);

    if (!square) {
      return;
    }

    const [piece, color] = square;

    switch (piece) {
      case Pieces.Pawn:
        this.hydratePawnLegalMove(board, rank, squareNum, color);
        break;
    }
  }

  private hydratePawnLegalMove(board: BoardMap,
                               rank: number,
                               squareNum: number,
                               color: Colors): void {
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

    this.updateAvailableMoves(moves);
  }

  private updateAvailableMoves(moves: Move[]): void {
    this.gameStateSubject.next({
      ...this.gameStateSubject.value,
      availableMoves: moves,
    });
  }
}
