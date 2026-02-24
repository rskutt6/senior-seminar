export type CreateAssignmentDto = {
  description: string;
  weight: number;
  dueAt: string; // ISO date string from frontend
  userId: number;
  courseId: number;
};
