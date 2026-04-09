export type ChecklistItemDto = {
  id: string;
  step: string;
  minutes: number;
  checked: boolean;
};

export type CreateAssignmentDto = {
  title: string;
  description: string;
  weight?: number | null;
  dueAt?: string | null;
  userId: number;
  courseId?: number | null;

  assignmentType?: string | null;
  problemCount?: number | null;
  pageCount?: number | null;

  summary?: string | null;
  checklistOverview?: string | null;
  checklistItems?: ChecklistItemDto[] | null;

  priority?: string | null;
  status?: string | null;
  notes?: string | null;
};