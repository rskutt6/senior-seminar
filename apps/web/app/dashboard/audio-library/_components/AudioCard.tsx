"use client";

import type { AudioItem } from "../_lib/types";

type Props = {
  item: AudioItem;
  selected: boolean;
  folderName: string;
  onSelect: () => void;
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
};

export default function AudioCard({
  item,
  selected,
  folderName,
  onSelect,
  onRename,
  onMove,
  onDelete,
}: Props) {
  return (
    <div
      className={`grid grid-cols-[minmax(0,2fr)_110px_140px_120px_190px] gap-4 border-b border-[#F1EBE1] px-5 py-4 ${
        selected ? "bg-[#FAF8F4]" : "bg-white"
      }`}
    >
      <button type="button" onClick={onSelect} className="min-w-0 text-left">
        <p className="truncate font-semibold text-[#6E7F5B]">{item.title}</p>
        <p className="mt-1 truncate text-sm text-[#8A7967]">
          {item.sourceName || "No source name"}
        </p>
      </button>

      <button
        type="button"
        onClick={onSelect}
        className="text-left text-sm text-[#8A7967]"
      >
        {item.sourceType === "pdf" ? "PDF" : "Text"}
      </button>

      <button
        type="button"
        onClick={onSelect}
        className="truncate text-left text-sm text-[#8A7967]"
      >
        {folderName}
      </button>

      <button
        type="button"
        onClick={onSelect}
        className="text-left text-sm text-[#8A7967]"
      >
        {new Date(item.createdAt).toLocaleDateString()}
      </button>

      <div className="flex flex-wrap items-start gap-2">
        <button
          type="button"
          onClick={onRename}
          className="rounded-lg border border-[#9CAF88] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#6E7F5B] hover:bg-[#F7F4EE]"
        >
          Rename
        </button>

        <button
          type="button"
          onClick={onMove}
          className="rounded-lg border border-[#9CAF88] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#6E7F5B] hover:bg-[#F7F4EE]"
        >
          Move
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg border border-[#c9837a] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#c9837a] hover:bg-[#fff4f2]"
        >
          Delete
        </button>
      </div>
    </div>
  );
}