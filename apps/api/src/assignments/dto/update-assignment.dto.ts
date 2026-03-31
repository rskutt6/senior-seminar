export type UpdateAssignmentDto = {
  title?: string | null;
  description?: string;
  weight?: number | null;
  dueAt?: string | null;
  courseId?: number | null;
};