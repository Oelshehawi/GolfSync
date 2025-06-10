export type PaceOfPlayStatus =
  | "pending"
  | "on_time"
  | "behind"
  | "ahead"
  | "completed"
  | "completed_on_time"
  | "completed_early"
  | "completed_late";

export interface PaceOfPlayHistoryItem {
  id: number;
  timeBlockId: number;
  date: string;
  startTime: string;
  actualStartTime: Date | null;
  turn9Time: Date | null;
  finishTime: Date | null;
  expectedStartTime: Date;
  expectedTurn9Time: Date;
  expectedFinishTime: Date;
  status: PaceOfPlayStatus;
  notes: string | null;
  createdAt: Date;
}

export interface PaceOfPlayRecord {
  id: number;
  timeBlockId: number;
  startTime: Date | null;
  turn9Time: Date | null;
  finishTime: Date | null;
  expectedStartTime: Date;
  expectedTurn9Time: Date;
  expectedFinishTime: Date;
  status: string;
  lastUpdatedBy: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface TimeBlockWithPaceOfPlay {
  id: number;
  startTime: string;
  teesheetId: number;
  paceOfPlay: PaceOfPlayRecord | null;
  playerNames: string;
  numPlayers: number;
}
