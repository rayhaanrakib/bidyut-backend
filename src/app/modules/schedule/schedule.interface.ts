export interface CreateScheduleInput {
  title: string;
  type: "PLANNED" | "MAINTENANCE" | "EMERGENCY";
  areaId?: string;
  feederId?: string;
  startTime: Date;
  endTime: Date;
}

export type UpdateScheduleInput = Partial<CreateScheduleInput>;
