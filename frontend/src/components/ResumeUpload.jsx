export default function ResumeUpload({
  dragActive,
  accept,
  onDrop,
  onDragOver,
  onDragLeave,
  onInputChange,
  loading,
  file,
}) {
  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={`relative rounded-2xl border-2 border-dashed p-10 transition-colors ${
        dragActive
          ? "border-brand-500 bg-brand-500/10"
          : "border-slate-600 bg-panel/60 hover:border-slate-500"
      }`}
    >
      <input
        id="resume-upload"
        type="file"
        accept={accept}
        onChange={onInputChange}
        disabled={loading}
        className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
      <div className="pointer-events-none flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600/20 text-brand-500">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
            <path d="M12 16a1 1 0 0 0 1-1V8.41l1.88 1.88a1 1 0 1 0 1.41-1.41l-3.59-3.59a1 1 0 0 0-1.41 0l-3.59 3.59a1 1 0 1 0 1.41 1.41L11 8.41V15a1 1 0 0 0 1 1Z" />
            <path d="M5 20a3 3 0 0 1-3-3v-1a1 1 0 1 1 2 0v1a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a1 1 0 1 1 2 0v1a3 3 0 0 1-3 3H5Z" />
          </svg>
        </div>
        <div>
          <p className="text-lg font-medium text-white">
            {file ? file.name : "Drop your resume here"}
          </p>
          <p className="mt-1 text-sm text-muted">
            PDF, DOC, or DOCX · max 10 MB
          </p>
        </div>
        {loading && (
          <p className="text-sm text-brand-500 animate-pulse">Parsing with AI…</p>
        )}
      </div>
    </div>
  );
}
