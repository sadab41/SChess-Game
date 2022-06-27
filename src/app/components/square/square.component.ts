import { Component, Input, OnInit } from '@angular/core';

import { combineLatest, filter, shareReplay } from 'rxjs';

import { GameService } from '../../services/game.service';
import { Colors } from '../../models/colors.enum';
import { Pieces } from '../../models/pieces.enum';

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
}
