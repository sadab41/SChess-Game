export interface Move {
  square: number;
  action: MoveActions;
}

export enum MoveActions {
  Move = 'Move',
  Capture = 'Capture',
}
