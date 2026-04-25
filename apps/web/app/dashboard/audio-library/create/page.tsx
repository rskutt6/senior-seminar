"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type TTSState = "idle" | "loading" | "ready" | "generating" | "done";
type InputMode = "pdf" | "text";

type AudioFolder = {
  id: number;
  name: string;
  createdAt: string;
};

type GenerateAudioResponse = {
  id: number;
  title: string;
  sourceType: "pdf" | "text";
  sourceName?: string | null;
  folderId?: number | null;
  createdAt: string;
  audioUrl: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function CreateAudioPage() {
  const [mode, setMode] = useState<InputMode>("pdf");
  const [ttsState, setTtsState] = useState<TTSState>("idle");

  const [folders, setFolders] = useState<AudioFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");

  const [extractedText, setExtractedText] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [fileName, setFileName] = useState("");

  const [error, setError] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [createdAudioId, setCreatedAudioId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeText = mode === "pdf" ? extractedText : pastedText.trim();
  const readyLabel = mode === "pdf" ? fileName || "Uploaded PDF" : "Pasted text";

  useEffect(() => {
    async function loadFolders() {
      try {
        setLoadingFolders(true);

        const res = await fetch(`${API_BASE}/audio/library`, {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Failed to load folders");
        }

        setFolders(data?.folders ?? []);
      } catch (err) {
        console.error("Failed to load folders", err);
      } finally {
        setLoadingFolders(false);
      }
    }

    loadFolders();
  }, []);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setAudioUrl("");
    setCreatedAudioId(null);
    setLoading(false);
    setTtsState("loading");
    setFileName(file.name);
    setExtractedText("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/pdf/extract-text`, {
        method: "POST",
        body: formData,
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(data?.message || "Failed to extract text");
      }

      const text = data?.text?.trim?.() ?? "";

      if (!text) {
        throw new Error("No readable text found in this PDF");
      }

      setExtractedText(text);
      setTtsState("ready");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setTtsState("idle");
    }
  }

  function handleModeChange(nextMode: InputMode) {
    setError("");
    setAudioUrl("");
    setCreatedAudioId(null);
    setLoading(false);
    setMode(nextMode);

    if (nextMode === "text") {
      setTtsState(pastedText.trim() ? "ready" : "idle");
    } else {
      setTtsState(extractedText ? "ready" : "idle");
    }
  }

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;

    setPastedText(value);
    setError("");
    setAudioUrl("");
    setCreatedAudioId(null);

    if (mode === "text") {
      setTtsState(value.trim() ? "ready" : "idle");
    }
  }

  async function generateAudio() {
    if (!activeText) return;

    try {
      setError("");
      setAudioUrl("");
      setCreatedAudioId(null);
      setLoading(true);
      setTtsState("generating");

      const title =
        mode === "pdf"
          ? fileName.replace(/\.pdf$/i, "") || "PDF audio"
          : pastedText.trim().slice(0, 40) || "Pasted text audio";

      const folderId =
        selectedFolderId === "" ? null : Number(selectedFolderId);

      const res = await fetch(`${API_BASE}/audio/text-to-speech`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: activeText,
          title,
          sourceType: mode,
          sourceName: mode === "pdf" ? fileName : "Pasted text",
          folderId,
        }),
      });

      let data: GenerateAudioResponse | any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(data?.message || "Failed to generate audio");
      }

      setAudioUrl(data.audioUrl);
      setCreatedAudioId(data.id);
      setTtsState("done");
    } catch (err: any) {
      setError(err.message || "Failed to generate audio");
      setTtsState(activeText ? "ready" : "idle");
    } finally {
      setLoading(false);
    }
  }

  function resetPdf() {
    setFileName("");
    setExtractedText("");
    setError("");
    setAudioUrl("");
    setCreatedAudioId(null);
    setLoading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setTtsState(mode === "text" ? (pastedText.trim() ? "ready" : "idle") : "idle");
  }

  const showControls =
    ttsState === "ready" || ttsState === "generating" || ttsState === "done";

  return (
    <main className="min-h-screen bg-[#F4F1EC] px-6 py-8 text-[#6E7F5B]">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Link
            href="/dashboard/audio-library"
            className="inline-block text-sm text-[#8A7967] hover:text-[#6E7F5B]"
          >
            ← Back to library
          </Link>
        </div>

        <div className="rounded-3xl border border-[#D8D2C8] bg-white p-6 shadow-sm md:p-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Create Audio</h1>
          <p className="mt-2 text-sm text-[#8A7967]">
            Upload a PDF or paste text and convert it into audio.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleModeChange("pdf")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                mode === "pdf"
                  ? "bg-[#6E7F5B] text-white"
                  : "border border-[#9CAF88] bg-white text-[#6E7F5B] hover:bg-[#F7F4EE]"
              }`}
            >
              Upload PDF
            </button>

            <button
              type="button"
              onClick={() => handleModeChange("text")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                mode === "text"
                  ? "bg-[#6E7F5B] text-white"
                  : "border border-[#9CAF88] bg-white text-[#6E7F5B] hover:bg-[#F7F4EE]"
              }`}
            >
              Paste Text
            </button>
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-[#8A7967]">
              Save to folder
            </label>

            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              disabled={loadingFolders}
              className="w-full rounded-xl border border-[#9CAF88] bg-white px-4 py-3 text-sm text-[#6E7F5B] outline-none"
            >
              <option value="">No folder</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>

            <p className="mt-2 text-xs text-[#8A7967]">
              {loadingFolders
                ? "Loading folders..."
                : "Optional: organize the audio before saving it."}
            </p>
          </div>

          <div className="mt-8">
            {mode === "pdf" ? (
              <div>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer rounded-2xl border-2 border-dashed border-[#9CAF88] bg-[#FCFBF8] px-6 py-12 text-center transition hover:bg-[#F8F5F0]"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  <p className="mb-3 text-4xl">📄</p>

                  {fileName ? (
                    <>
                      <p className="font-semibold text-[#6E7F5B]">{fileName}</p>
                      <p className="mt-2 text-sm text-[#8A7967]">
                        Click to replace this PDF
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-[#6E7F5B]">
                        Click to upload a PDF
                      </p>
                      <p className="mt-2 text-sm text-[#8A7967]">Max 20MB</p>
                    </>
                  )}
                </div>

                {fileName && (
                  <button
                    type="button"
                    onClick={resetPdf}
                    className="mt-3 text-sm text-[#8A7967] underline underline-offset-2 hover:text-[#6E7F5B]"
                  >
                    Remove PDF
                  </button>
                )}
              </div>
            ) : (
              <div>
                <label className="mb-2 block text-sm font-medium text-[#8A7967]">
                  Paste text to read aloud
                </label>

                <textarea
                  value={pastedText}
                  onChange={handleTextChange}
                  placeholder="Paste your text here..."
                  rows={10}
                  className="w-full rounded-2xl border border-[#9CAF88] bg-white px-4 py-3 text-sm text-[#6E7F5B] outline-none"
                />

                <p className="mt-2 text-xs text-[#8A7967]">
                  Paste any notes, instructions, or reading material.
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-[#c9837a] bg-[rgba(201,131,122,0.15)] px-4 py-3 text-sm text-[#c9837a]">
              {error}
            </div>
          )}

          {ttsState === "loading" && mode === "pdf" && (
            <div className="mt-6 rounded-2xl border border-[#D8D2C8] bg-[#FCFBF8] px-4 py-5 text-center text-sm text-[#8A7967]">
              Extracting text from PDF...
            </div>
          )}

          {showControls && (
            <div className="mt-6 rounded-2xl border border-[#D8D2C8] bg-[#FCFBF8] p-5">
              <p className="text-sm text-[#8A7967]">
                Ready to convert:{" "}
                <span className="font-semibold text-[#6E7F5B]">{readyLabel}</span>
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={generateAudio}
                  disabled={loading || !activeText}
                  className="rounded-xl bg-[#6E7F5B] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Generating..." : "Generate Audio"}
                </button>

                <Link
                  href="/dashboard/audio-library"
                  className="rounded-xl border border-[#9CAF88] bg-white px-5 py-3 text-sm font-semibold text-[#6E7F5B] transition hover:bg-[#F7F4EE]"
                >
                  Cancel
                </Link>
              </div>

              {audioUrl && (
                <div className="mt-6 rounded-2xl border border-[#D8D2C8] bg-white p-4">
                  <p className="mb-3 text-sm font-semibold text-[#6E7F5B]">
                    Audio generated successfully
                  </p>

                  <audio controls className="w-full">
                    <source src={audioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href="/dashboard/audio-library"
                      className="rounded-xl bg-[#6E7F5B] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      View in Library
                    </Link>

                    {createdAudioId && (
                      <Link
                        href={`/dashboard/audio-library/${createdAudioId}`}
                        className="rounded-xl border border-[#9CAF88] bg-white px-4 py-2 text-sm font-semibold text-[#6E7F5B] transition hover:bg-[#F7F4EE]"
                      >
                        Open Audio
                      </Link>
                    )}
                  </div>
                </div>
              )}

              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-[#8A7967] hover:text-[#6E7F5B]">
                  Preview text
                </summary>

                <div className="mt-3 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl border border-[#D8D2C8] bg-white p-4 text-sm text-[#6E7F5B]">
                  {activeText}
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}