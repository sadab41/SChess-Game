import { Component, Input, OnInit } from '@angular/core';

import { filter } from 'rxjs';

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

  constructor(private gameService: GameService) {
  }

  ngOnInit(): void {
    this.gameService.getPieceInSquare$(this.rank, this.file)
      .pipe(filter(Boolean))
      .subscribe(square => this.square = square);
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
