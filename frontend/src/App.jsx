import { useCallback, useState } from "react";
import { parseResume } from "./api/client.js";
import ParsedResumeView from "./components/ParsedResumeView.jsx";
import ResumeUpload from "./components/ResumeUpload.jsx";
import { useResumeUpload } from "./hooks/useResumeUpload.js";

export default function App() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleParse = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await parseResume(file);
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to parse resume.");
    } finally {
      setLoading(false);
    }
  }, []);

  const upload = useResumeUpload(handleParse);

  const handleReset = () => {
    upload.reset();
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-panel/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 font-bold text-white">
              H
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">HireBot</h1>
              <p className="text-xs text-muted">AI Resume Parser</p>
            </div>
          </div>
          {(result || error) && (
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
            >
              Parse another
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {!result && (
          <div className="mx-auto max-w-2xl">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-white">Upload a resume</h2>
              <p className="mt-2 text-muted">
                Extract structured candidate data from PDF, DOC, or DOCX using Groq LLM.
              </p>
            </div>
            <ResumeUpload {...upload} loading={loading} />
            {error && (
              <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
                {error}
              </div>
            )}
          </div>
        )}

        {result && <ParsedResumeView data={result} />}
      </main>
    </div>
  );
}
