import { Component, Input } from '@angular/core';

@Component({
  selector: 'jv-square',
  templateUrl: './square.component.html',
  styleUrls: ['./square.component.scss'],
})
export class SquareComponent {
  @Input() rank!: number;
  @Input() file!: number;
}
