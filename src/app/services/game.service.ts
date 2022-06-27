import { Injectable } from '@angular/core';

import { BehaviorSubject, map, Observable, pluck } from 'rxjs';

import { GameState } from '../models/game-state.model';
import { Colors } from '../models/colors.enum';
import { Pieces } from '../models/pieces.enum';
import { boardInitialPosition, squareNumber } from '../utils/board';

@Injectable({ providedIn: 'root' })
export class GameService {
  private gameStateSubject = new BehaviorSubject<GameState>({
    board: boardInitialPosition,
    active: Colors.White,
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

  selectSquare(rank: number, file: number): void {
    const { board, active } = this.gameStateSubject.value;
    const squareNum = squareNumber(rank, file);

    let square: { rank: number, file: number } | null = null;

    if (board.has(squareNum)) {
      const color = board.get(squareNum)?.[1];

      if (active === color) {
        square = { rank, file };
      }
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
}
