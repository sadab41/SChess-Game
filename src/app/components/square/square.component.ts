import { Component, Input, OnInit } from '@angular/core';

import { combineLatest, filter, shareReplay } from 'rxjs';

import { GameService } from '../../services/game.service';
import { Colors } from '../../models/colors.enum';
import { Pieces } from '../../models/pieces.enum';
import { MoveActions } from '../../models/move.model';
import { squareNumber } from '../../utils/board';

@Component({
  selector: 'jv-square',
  templateUrl: './square.component.html',
  styleUrls: ['./square.component.scss'],
})
export class SquareComponent implements OnInit {
  @Input() rank!: number;
  @Input() file!: number;

  square!: [Pieces, Colors];
  isActive!: boolean;
  isSelected!: boolean;
  squareAction!: MoveActions | undefined;

  readonly moveActionsEnum = MoveActions;

  constructor(private gameService: GameService) {
  }

  ngOnInit(): void {
    const piece$ = this.gameService.getPieceInSquare$(this.rank, this.file)
      .pipe(
        filter(Boolean),
        shareReplay(),
      );

    piece$
      .subscribe(square => this.square = square);

    combineLatest([
      piece$,
      this.gameService.activeColor$,
    ])
      .subscribe(([[, color], active]) => this.isActive = color === active);

    this.gameService.selectedSquare$
      .subscribe(value => {
        if (!value) {
          this.isSelected = false;
        } else {
          this.isSelected = value.rank === this.rank
            && value.file === this.file;
        }
      });

    this.gameService.availableMoves$
      .subscribe(moves => {
        const move = moves
          .find(move => move.square === squareNumber(this.rank, this.file));

        this.squareAction = move?.action;
      });
  }

  get isSelectable(): boolean {
    return this.isActive
      || this.squareAction === MoveActions.Capture
      || this.squareAction === MoveActions.Move;
  }

  get imgSrc(): string | null {
    if (!this.square) {
      return null;
    }

    const piece = this.square[0].toLowerCase();
    const color = this.square[1].toLowerCase();

    return `assets/icons/pieces/${ piece }-${ color }.svg`;
  }

  get imgAlt(): string | null {
    if (!this.square) {
      return null;
    }

    const [piece, color] = this.square;

    return `${piece} ${color}`;
  }

  onSquareClick(): void {
    this.gameService.selectSquare(this.rank, this.file);
  }
}
