"use client";

import type { ReactNode } from "react";

type Props = {
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
};

export default function ModalShell({
  title,
  description,
  children,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-3xl border border-[#D8D2C8] bg-[#FDFBF7] p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#6E7F5B]">
              {title}
            </h2>
            <p className="mt-1 text-sm text-[#8A7967]">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-[#8A7967] hover:bg-[#F1ECE3] hover:text-[#6E7F5B]"
          >
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}