"use client";

import type { AudioFolder, AudioItem, FolderFilter } from "../_lib/types";

type Props = {
  folders: AudioFolder[];
  items: AudioItem[];
  selectedFolder: FolderFilter;
  onSelectFolder: (folder: FolderFilter) => void;
  onCreateFolder: () => void;
};

export default function FolderSidebar({
  folders,
  items,
  selectedFolder,
  onSelectFolder,
  onCreateFolder,
}: Props) {
  const allCount = items.length;
  const uncategorizedCount = items.filter((item) => item.folderId == null).length;

  return (
    <aside className="border-r border-[#D8D2C8] bg-[#F8F5F0] p-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Audio Library</h1>
        <p className="mt-1 text-sm text-[#8A7967]">
          Organize, rename, and manage saved audio.
        </p>
      </div>

      <div className="mt-6 space-y-2">
        <SidebarButton
          label={`All Audio (${allCount})`}
          active={selectedFolder === "all"}
          onClick={() => onSelectFolder("all")}
        />
        <SidebarButton
          label={`Uncategorized (${uncategorizedCount})`}
          active={selectedFolder === "uncategorized"}
          onClick={() => onSelectFolder("uncategorized")}
        />
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#8A7967]">
            Folders
          </h2>

          <button
            type="button"
            onClick={onCreateFolder}
            className="rounded-lg border border-[#9CAF88] bg-white px-3 py-1.5 text-xs font-semibold text-[#6E7F5B] hover:bg-[#F7F4EE]"
          >
            + New
          </button>
        </div>

        <div className="space-y-2">
          {folders.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#D8D2C8] px-3 py-4 text-sm text-[#8A7967]">
              No folders yet.
            </p>
          ) : (
            folders.map((folder) => {
              const count = items.filter((item) => item.folderId === folder.id).length;

              return (
                <SidebarButton
                  key={folder.id}
                  label={`${folder.name} (${count})`}
                  active={selectedFolder === folder.id}
                  onClick={() => onSelectFolder(folder.id)}
                />
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}

function SidebarButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
        active
          ? "bg-[#6E7F5B] text-white"
          : "bg-white text-[#6E7F5B] hover:bg-[#F1ECE3]"
      }`}
    >
      {label}
    </button>
  );
}