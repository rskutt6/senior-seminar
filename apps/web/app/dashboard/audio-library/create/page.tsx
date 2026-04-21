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
  const readyLabel = mode === "pdf" ? fileName || "Uploaded PDF" : "Pasted text";

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(""); setAudioUrl(""); setLoading(false);
    setTtsState("loading"); setFileName(file.name); setExtractedText("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("http://localhost:4000/pdf/extract-text", { method: "POST", body: formData });
      let data: any = null;
      try { data = await res.json(); } catch { data = null; }
      if (!res.ok) throw new Error(data?.message || "Failed to extract text");
      const text = data?.text?.trim?.() ?? "";
      if (!text) throw new Error("No readable text found in this PDF");
      setExtractedText(text);
      setTtsState("ready");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setTtsState("idle");
    }
  }

  function handleModeChange(nextMode: InputMode) {
    setError(""); setAudioUrl(""); setLoading(false); setMode(nextMode);
    if (nextMode === "text") setTtsState(pastedText.trim() ? "ready" : "idle");
    else setTtsState(extractedText ? "ready" : "idle");
  }

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setPastedText(value); setError(""); setAudioUrl("");
    if (mode === "text") setTtsState(value.trim() ? "ready" : "idle");
  }

  async function generateAudio() {
    if (!activeText) return;
    try {
      setError(""); setAudioUrl(""); setLoading(true); setTtsState("generating");
      const title = mode === "pdf" ? fileName.replace(/\.pdf$/i, "") || "PDF audio" : pastedText.trim().slice(0, 40) || "Pasted text audio";
      const res = await fetch("http://localhost:4000/audio/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: activeText, title, sourceType: mode, sourceName: mode === "pdf" ? fileName : "Pasted text" }),
      });
      let data: any = null;
      try { data = await res.json(); } catch { data = null; }
      if (!res.ok) throw new Error(data?.message || "Failed to generate audio");
      setAudioUrl(data.audioUrl);
      setTtsState("done");
    } catch (err: any) {
      setError(err.message || "Failed to generate audio");
      setTtsState(activeText ? "ready" : "idle");
    } finally {
      setLoading(false);
    }
  }

  function resetPdf() {
    setFileName(""); setExtractedText(""); setError(""); setAudioUrl(""); setLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setTtsState(mode === "text" ? (pastedText.trim() ? "ready" : "idle") : "idle");
  }

  const showControls = ttsState === "ready" || ttsState === "generating" || ttsState === "done";

  return (
    <main style={page}>
      <div style={card}>
        <h1 style={title}>Create Audio</h1>
        <p style={subtitle}>Upload a PDF or paste text and convert it into audio.</p>

        <div style={modeRow}>
          <button type="button" onClick={() => handleModeChange("pdf")} style={{ ...modeBtn, ...(mode === "pdf" ? modeBtnActive : {}) }}>
            Upload PDF
          </button>
          <button type="button" onClick={() => handleModeChange("text")} style={{ ...modeBtn, ...(mode === "text" ? modeBtnActive : {}) }}>
            Paste Text
          </button>
        </div>

        {mode === "pdf" ? (
          <div>
            <div style={dropZone} onClick={() => fileInputRef.current?.click()}>
              <input ref={fileInputRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleFileUpload} />
              <p style={{ fontSize: 32, marginBottom: 8 }}>📄</p>
              {fileName ? (
                <p style={{ fontWeight: 700, color: '#6E7F5B' }}>{fileName}</p>
              ) : (
                <>
                  <p style={{ fontWeight: 700, color: '#6E7F5B' }}>Click to upload a PDF</p>
                  <p style={{ fontSize: 13, color: '#8A7967', marginTop: 4 }}>Max 20MB</p>
                </>
              )}
            </div>
            {fileName && (
              <button type="button" onClick={resetPdf} style={removBtn}>Remove PDF</button>
            )}
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Paste text to read aloud</label>
            <textarea value={pastedText} onChange={handleTextChange} placeholder="Paste your text here..." rows={10} style={textarea} />
            <p style={{ fontSize: 13, color: '#8A7967', marginTop: 6 }}>Paste any notes, instructions, or reading material.</p>
          </div>
        )}

        {error && <div style={errorBox}>{error}</div>}

        {ttsState === "loading" && mode === "pdf" && (
          <p style={{ color: '#8A7967', textAlign: 'center', padding: '16px 0' }}>Extracting text from PDF...</p>
        )}

        {showControls && (
          <div style={controlBox}>
            <p style={{ fontSize: 13, color: '#8A7967', marginBottom: 16 }}>
              Ready to convert: <span style={{ color: '#6E7F5B', fontWeight: 700 }}>{readyLabel}</span>
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button onClick={generateAudio} disabled={loading || !activeText} style={{ ...generateBtn, opacity: loading || !activeText ? 0.6 : 1 }}>
                {loading ? "Generating..." : "Generate Audio"}
              </button>
            </div>
            {audioUrl && (
              <div style={{ marginTop: 20 }}>
                <audio controls style={{ width: '100%' }}>
                  <source src={audioUrl} type="audio/mpeg" />
                </audio>
              </div>
            )}
            <details style={{ marginTop: 12 }}>
              <summary style={{ fontSize: 13, color: '#8A7967', cursor: 'pointer' }}>Preview text</summary>
              <p style={{ marginTop: 8, fontSize: 13, color: '#6E7F5B', maxHeight: 192, overflowY: 'auto', whiteSpace: 'pre-wrap', background: '#F4F1EC', borderRadius: 10, padding: 12 }}>
                {activeText}
              </p>
            </details>
          </div>
        )}
      </div>
    </main>
  );
}

const page: React.CSSProperties = { minHeight: '100vh', padding: 24, background: '#F4F1EC', color: '#6E7F5B' };
const card: React.CSSProperties = { maxWidth: 680, margin: '0 auto' };
const title: React.CSSProperties = { fontSize: 28, fontWeight: 900, color: '#6E7F5B', marginBottom: 6 };
const subtitle: React.CSSProperties = { fontSize: 14, color: '#8A7967', marginBottom: 24 };
const modeRow: React.CSSProperties = { display: 'flex', gap: 10, marginBottom: 20 };
const modeBtn: React.CSSProperties = { padding: '9px 18px', borderRadius: 10, border: '1px solid #9CAF88', background: '#ffffff', color: '#6E7F5B', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' };
const modeBtnActive: React.CSSProperties = { background: '#6E7F5B', color: '#ffffff', border: '1px solid #6E7F5B' };
const dropZone: React.CSSProperties = { border: '2px dashed #9CAF88', borderRadius: 14, padding: 40, textAlign: 'center', cursor: 'pointer', background: '#ffffff', marginBottom: 12 };
const removBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#8A7967', fontSize: 13, cursor: 'pointer', marginBottom: 16, fontFamily: 'inherit' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, color: '#8A7967', marginBottom: 8 };
const textarea: React.CSSProperties = { width: '100%', borderRadius: 12, border: '1px solid #9CAF88', background: '#ffffff', padding: 12, fontSize: 14, color: '#6E7F5B', fontFamily: 'inherit', outline: 'none', resize: 'vertical' };
const errorBox: React.CSSProperties = { background: 'rgba(201,131,122,0.15)', border: '1px solid #c9837a', color: '#c9837a', borderRadius: 12, padding: '12px 16px', marginBottom: 16 };
const controlBox: React.CSSProperties = { background: '#ffffff', border: '1px solid #9CAF88', borderRadius: 16, padding: 24 };
const generateBtn: React.CSSProperties = { background: '#6E7F5B', color: '#ffffff', fontWeight: 700, fontSize: 15, padding: '12px 24px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit' };
