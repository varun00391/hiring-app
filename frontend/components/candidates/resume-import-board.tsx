"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CloudUpload } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Task = { filename: string; status: string; candidate_id?: string; error?: string };

export function ResumeImportBoard() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});

  function onFilesAccepted(next: FileList | null) {
    if (!next) return;
    const list = [...next];
    if (list.length > 50) {
      toast.error("Limit 50 files per batch");
      return;
    }
    setFiles(list);
  }

  async function beginUpload() {
    if (!files.length) return;
    const form = new FormData();
    for (const f of files) {
      form.append("files", f);
      setProgress((s) => ({ ...s, [f.name]: 8 }));
    }
    try {
      for (let i = 0; i < files.length; i += 1) {
        const name = files[i].name;
        setProgress((s) => ({ ...s, [name]: 45 }));
      }

      const { data } = await api.post<Task[]>("/resumes/upload", form, {
        onUploadProgress: (evt) => {
          const pct = evt.total ? Math.round((evt.loaded / evt.total) * 100) : 25;
          setProgress(Object.fromEntries(files.map((f) => [f.name, pct])));
        },
      });

      for (const f of files) {
        const match = data.find((d) => d.filename === f.name);
        setProgress((s) => ({ ...s, [f.name]: match?.status === "failed" ? 100 : 100 }));
      }

      toast.success("Resumes uploaded — extraction runs in the background");
      setFiles([]);
      setProgress({});
      router.push("/candidates");
    } catch {
      toast.error("Some files failed validation");
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <button
        type="button"
        onClick={() => router.push("/candidates")}
        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to table
      </button>
      <div className="rounded-3xl border border-dashed border-teal-300/70 bg-gradient-to-br from-white/95 via-teal-50/40 to-violet-50/50 p-8 text-center shadow-inner dark:border-teal-800 dark:from-neutral-950/90 dark:via-teal-950/20 dark:to-violet-950/30">
        <CloudUpload className="mx-auto h-10 w-10 text-teal-500" />
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Upload resumes</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          PDF or DOCX, up to 50 files and 10MB each. Text is extracted server-side and parsed into candidate fields.
        </p>
        <label className="mt-6 inline-flex cursor-pointer items-center justify-center rounded-2xl border border-teal-600/30 bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 dark:border-transparent">
          Browse files
          <input type="file" multiple accept=".pdf,.docx" className="hidden" onChange={(e) => onFilesAccepted(e.target.files)} />
        </label>
        <div className="mt-6 space-y-2 text-left text-sm">
          {files.map((file) => (
            <div key={file.name} className="rounded-2xl border border-neutral-100 p-3 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <p className="font-medium">{file.name}</p>
                <span className="text-xs text-neutral-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-neutral-100 dark:bg-neutral-900">
                <div
                  className={cn("h-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all")}
                  style={{ width: `${progress[file.name] ?? 0}%` }}
                />
              </div>
            </div>
          ))}
          {!files.length && <p className="text-center text-neutral-500">No files selected yet.</p>}
        </div>
        <Button className="mt-6 w-full bg-teal-600 hover:bg-teal-700" disabled={!files.length} onClick={beginUpload}>
          Upload resumes
        </Button>
      </div>
    </div>
  );
}
