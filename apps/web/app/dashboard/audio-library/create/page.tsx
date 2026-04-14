"use client";

import { useRef, useState } from "react";

type TTSState = "idle" | "loading" | "ready" | "generating" | "done";
type InputMode = "pdf" | "text";

export default function CreateAudioPage() {
  const [mode, setMode] = useState<InputMode>("pdf");
  const [ttsState, setTtsState] = useState<TTSState>("idle");
  const [extractedText, setExtractedText] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeText = mode === "pdf" ? extractedText : pastedText.trim();
  const readyLabel =
    mode === "pdf" ? fileName || "Uploaded PDF" : "Pasted text";

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setAudioUrl("");
    setLoading(false);
    setTtsState("loading");
    setFileName(file.name);
    setExtractedText("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:4000/pdf/extract-text", {
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

    if (mode === "text") {
      setTtsState(value.trim() ? "ready" : "idle");
    }
  }

  async function generateAudio() {
    if (!activeText) return;

    try {
      setError("");
      setAudioUrl("");
      setLoading(true);
      setTtsState("generating");

      const res = await fetch("http://localhost:4000/audio/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: activeText }),
      });

      if (!res.ok) {
        let message = "Failed to generate audio";
        try {
          const data = await res.json();
          message = data?.message || message;
        } catch {}
        throw new Error(message);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      setAudioUrl(url);
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
    setLoading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setTtsState(mode === "text" ? (pastedText.trim() ? "ready" : "idle") : "idle");
  }

  const showControls =
    ttsState === "ready" || ttsState === "generating" || ttsState === "done";

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Create Audio</h1>
      <p className="text-gray-400 mb-8">
        Upload a PDF or paste text and convert it into audio.
      </p>

      <div className="flex gap-3 mb-6">
        <button
          type="button"
          onClick={() => handleModeChange("pdf")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === "pdf"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          Upload PDF
        </button>

        <button
          type="button"
          onClick={() => handleModeChange("text")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === "text"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          Paste Text
        </button>
      </div>

      {mode === "pdf" ? (
        <div>
          <div
            className="border-2 border-dashed border-gray-600 rounded-xl p-10 text-center cursor-pointer hover:border-blue-500 transition-colors mb-6"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
            <p className="text-4xl mb-3">📄</p>
            {fileName ? (
              <p className="font-semibold text-blue-400">{fileName}</p>
            ) : (
              <>
                <p className="font-semibold">Click to upload a PDF</p>
                <p className="text-sm text-gray-500 mt-1">Max 20MB</p>
              </>
            )}
          </div>

          {fileName && (
            <button
              type="button"
              onClick={resetPdf}
              className="mb-6 text-sm text-gray-400 hover:text-white"
            >
              Remove PDF
            </button>
          )}
        </div>
      ) : (
        <div className="mb-6">
          <label className="block text-sm text-gray-300 mb-2">
            Paste text to read aloud
          </label>
          <textarea
            value={pastedText}
            onChange={handleTextChange}
            placeholder="Paste your text here..."
            rows={10}
            className="w-full rounded-xl border border-gray-700 bg-gray-900 p-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-2">
            Paste any notes, instructions, or reading material.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/40 border border-red-500 text-red-300 rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {ttsState === "loading" && mode === "pdf" && (
        <div className="text-center text-gray-400 py-4">
          Extracting text from PDF...
        </div>
      )}

      {showControls && (
        <div className="bg-gray-800 rounded-xl p-6">
          <p className="text-sm text-gray-400 mb-4 truncate">
            Ready to convert: <span className="text-white">{readyLabel}</span>
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={generateAudio}
              disabled={loading || !activeText}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold px-6 py-3 rounded-lg transition-colors"
            >
              {loading ? "Generating..." : "Generate Audio"}
            </button>
          </div>

          {audioUrl && (
            <div className="mt-6">
              <audio controls className="w-full">
                <source src={audioUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          <details className="mt-4">
            <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-200">
              Preview text
            </summary>
            <p className="mt-2 text-sm text-gray-300 max-h-48 overflow-y-auto whitespace-pre-wrap bg-gray-900 rounded-lg p-3">
              {activeText}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}