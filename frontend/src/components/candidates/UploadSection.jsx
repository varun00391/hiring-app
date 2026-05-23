import { useCallback, useRef, useState } from "react";
import { Upload, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE_MB } from "../../utils/constants.js";
import { uploadCandidates } from "../../services/candidateService.js";

function validateFiles(fileList) {
  const files = Array.from(fileList);
  const allowed = [".pdf", ".doc", ".docx"];
  for (const file of files) {
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowed.includes(ext)) {
      throw new Error(`${file.name}: unsupported file type`);
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      throw new Error(`${file.name}: exceeds ${MAX_FILE_SIZE_MB} MB limit`);
    }
  }
  return files;
}

export default function UploadSection({ onUploadComplete }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const processFiles = useCallback(
    async (fileList) => {
      setError(null);
      setResults([]);
      let files;
      try {
        files = validateFiles(fileList);
      } catch (err) {
        setError(err.message);
        return;
      }

      setUploading(true);
      setProgress(0);

      try {
        const response = await uploadCandidates(files, {}, (event) => {
          if (event.total) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        });
        setResults(response.results || []);
        onUploadComplete?.();
      } catch (err) {
        setError(err.message);
      } finally {
        setUploading(false);
      }
    },
    [onUploadComplete],
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Upload Resumes</h3>
          <p className="text-sm text-slate-500">
            Select multiple files (PDF, DOC, DOCX) — up to {MAX_FILE_SIZE_MB} MB each
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Upload className="h-4 w-4" />
          Upload Files
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_FILE_TYPES}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) processFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {uploading && (
        <div className="mt-5 rounded-lg border border-indigo-100 bg-indigo-50/50 p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-700">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              Uploading & parsing resumes…
            </span>
            <span className="font-semibold text-indigo-600">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Parsing results
          </p>
          {results.map((result) => (
            <div
              key={result.file_name}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            >
              <span className="font-medium text-slate-700">{result.file_name}</span>
              <span className="flex items-center gap-2">
                {result.success ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="font-medium text-emerald-700">Parsed successfully</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-red-700">{result.error || "Parsing failed"}</span>
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
