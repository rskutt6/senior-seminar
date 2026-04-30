export type AudioItem = {
  id: number;
  title: string;
  sourceType: "pdf" | "text";
  sourceName?: string | null;
  folderId?: number | null;
  createdAt: string;
};

export type AudioFolder = {
  id: number;
  name: string;
  createdAt: string;
};

export type AudioLibraryResponse = {
  folders: AudioFolder[];
  items: AudioItem[];
};

export type FolderFilter = "all" | "uncategorized" | number;