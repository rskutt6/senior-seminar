export type CreateAssignmentDto = {
  title: string;
  description: string;
  weight?: number | null;
  dueAt?: string | null;
  userId: number;
  courseId?: number | null;
};