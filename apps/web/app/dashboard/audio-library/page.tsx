"use client";

import { useRef, useState } from "react";

type TTSState = "idle" | "loading" | "ready" | "playing" | "paused";

export default function AudioLibraryPage() {
  const [ttsState, setTtsState] = useState<TTSState>("idle");
  const [extractedText, setExtractedText] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setTtsState("loading");
    setFileName(file.name);
    stopSpeech();

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:4000/pdf/extract-text", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to extract text");
      }

      const data = await res.json();
      setExtractedText(data.text);
      setTtsState("ready");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setTtsState("idle");
    }
  }

  function speak() {
    if (!extractedText) return;

    const utterance = new SpeechSynthesisUtterance(extractedText);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => setTtsState("ready");
    utteranceRef.current = utterance;

    window.speechSynthesis.speak(utterance);
    setTtsState("playing");
  }

  function pause() {
    window.speechSynthesis.pause();
    setTtsState("paused");
  }

  function resume() {
    window.speechSynthesis.resume();
    setTtsState("playing");
  }

  function stopSpeech() {
    window.speechSynthesis.cancel();
    setTtsState(extractedText ? "ready" : "idle");
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Audio Library</h1>
      <p className="text-gray-400 mb-8">
        Upload a PDF and listen to it read aloud.
      </p>

      {/* Upload area */}
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

      {/* Error */}
      {error && (
        <div className="bg-red-900/40 border border-red-500 text-red-300 rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {/* Loading */}
      {ttsState === "loading" && (
        <div className="text-center text-gray-400 py-4">
          Extracting text from PDF...
        </div>
      )}

      {/* Player controls */}
      {(ttsState === "ready" || ttsState === "playing" || ttsState === "paused") && (
        <div className="bg-gray-800 rounded-xl p-6">
          <p className="text-sm text-gray-400 mb-4 truncate">
            Ready to play: <span className="text-white">{fileName}</span>
          </p>

          <div className="flex gap-3 justify-center">
            {ttsState === "ready" && (
              <button
                onClick={speak}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg transition-colors"
              >
                ▶ Play
              </button>
            )}

            {ttsState === "playing" && (
              <button
                onClick={pause}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold px-6 py-3 rounded-lg transition-colors"
              >
                ⏸ Pause
              </button>
            )}

            {ttsState === "paused" && (
              <button
                onClick={resume}
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg transition-colors"
              >
                ▶ Resume
              </button>
            )}

            {(ttsState === "playing" || ttsState === "paused") && (
              <button
                onClick={stopSpeech}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-6 py-3 rounded-lg transition-colors"
              >
                ⏹ Stop
              </button>
            )}
          </div>

          {/* Text preview */}
          <details className="mt-4">
            <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-200">
              Preview extracted text
            </summary>
            <p className="mt-2 text-sm text-gray-300 max-h-48 overflow-y-auto whitespace-pre-wrap bg-gray-900 rounded-lg p-3">
              {extractedText}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
