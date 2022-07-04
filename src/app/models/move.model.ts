export interface Move {
  square: number;
  action: MoveActions;
}

export interface HistoryMove {
  count: number;
  from: number;
  to: number;
  action: MoveActions;
}

export enum MoveActions {
  Move = 'Move',
  Capture = 'Capture',
  EnPassant = 'EnPassant',
}
