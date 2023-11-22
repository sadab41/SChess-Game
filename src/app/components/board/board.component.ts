import { Component } from '@angular/core';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
})
export class BoardComponent {
  readonly boardDirectionArray = new Array(8).fill(0).map((_, i) => i + 1);
}
