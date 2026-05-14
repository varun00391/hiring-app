"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StageBadge } from "@/components/ui/stage-badge";
import { useAuthStore } from "@/store/auth-store";
import type { CandidateDetail, CandidateStage } from "@/types/hirebot";

async function fetchDetail(id: string) {
  const { data } = await api.get<CandidateDetail>(`/candidates/${id}`);
  return data;
}

export function CandidateWorkspace({ candidateId }: { candidateId: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const admin = user?.role.name === "admin";

  const { data: candidate, isLoading } = useQuery({
    queryKey: ["candidate", candidateId],
    queryFn: () => fetchDetail(candidateId),
  });

  const { data: stages } = useQuery({
    queryKey: ["stages"],
    queryFn: async () => {
      const { data } = await api.get<CandidateStage[]>("/reference/stages");
      return data;
    },
  });

  const { data: tagMembers } = useQuery({
    queryKey: ["tag-members"],
    queryFn: async () => {
      const { data } = await api.get<{ id: string; full_name: string }[]>("/reference/tag-members");
      return data;
    },
    enabled: admin,
  });

  const { data: recruiters } = useQuery({
    queryKey: ["recruiters-ref"],
    queryFn: async () => {
      const { data } = await api.get<{ id: string; full_name: string }[]>("/reference/recruiters");
      return data;
    },
    enabled: admin,
  });

  const [stage, setStage] = useState<CandidateStage | undefined>(undefined);
  const [recruiterId, setRecruiterId] = useState("");
  const [tagId, setTagId] = useState("");

  useEffect(() => {
    if (candidate) {
      setStage(candidate.current_stage);
      setRecruiterId(candidate.recruiter_id ?? "");
      setTagId(candidate.assigned_tag_id ?? "");
    }
  }, [candidate]);

  const stageMutation = useMutation({
    mutationFn: async (nextStage: CandidateStage) => {
      await api.patch(`/candidates/${candidateId}/stage`, { stage: nextStage });
    },
    onSuccess: () => {
      toast.success("Stage updated");
      void qc.invalidateQueries({ queryKey: ["candidate", candidateId] });
    },
    onError: () => toast.error("Unable to update stage"),
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/candidates/${candidateId}/assign`, {
        recruiter_id: recruiterId || undefined,
        tag_member_id: tagId || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Assignment saved");
      void qc.invalidateQueries({ queryKey: ["candidate", candidateId] });
      void qc.invalidateQueries({ queryKey: ["candidates"] });
      void qc.invalidateQueries({ queryKey: ["recruiters-performance"] });
    },
    onError: () => toast.error("Assignment failed"),
  });

  async function handleDownloadResume(resumeId: string, filename: string) {
    if (!token) return;
    const res = await fetch(`${api.defaults.baseURL}/resumes/${resumeId}/file`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      toast.error("Download failed");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading || !candidate) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-40 animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
      </div>
    );
  }

  const selectedStage = stage ?? candidate.current_stage;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => router.push("/candidates")}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">{candidate.public_id}</p>
            <h1 className="text-2xl font-semibold tracking-tight">{candidate.full_name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StageBadge stage={candidate.current_stage} />
              <span className="text-sm text-neutral-500">Updated {new Date(candidate.updated_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          {candidate.linkedin_url ? (
            <Link
              href={candidate.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-sky-600 hover:underline"
            >
              LinkedIn ↗
            </Link>
          ) : null}
          {candidate.github_url ? (
            <Link
              href={candidate.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-neutral-700 hover:underline dark:text-neutral-200"
            >
              GitHub ↗
            </Link>
          ) : null}
        </div>
      </div>

      <Tabs.Root defaultValue="overview" className="space-y-4">
        <Tabs.List className="flex gap-2 overflow-x-auto pb-2 text-sm font-medium">
          {[
            "overview",
            "skills",
            "experience",
            "education",
            "documents",
            "notes",
            "activity",
            "resume",
          ].map((tab) => (
            <Tabs.Trigger
              key={tab}
              value={tab}
              className={cn(
                "rounded-full px-3 py-1.5 capitalize transition",
                "data-[state=active]:bg-neutral-900 data-[state=active]:text-white",
                "dark:data-[state=active]:bg-white dark:data-[state=active]:text-neutral-900",
                "data-[state=inactive]:text-neutral-500 hover:text-neutral-900 dark:hover:text-white",
              )}
            >
              {tab}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="text-sm font-semibold">Profile</CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Field label="Email" value={candidate.email} />
                <Field label="Phone" value={candidate.phone} />
                <Field label="Role applied" value={candidate.applied_role} />
                <Field label="Experience (yrs)" value={candidate.experience_years?.toString() ?? "—"} />
                <Field label="Match score" value={candidate.ai_match_score?.toString() ?? "—"} />
                <Field label="Recruiter" value={candidate.recruiter_name} />
                <Field label="TAG member" value={candidate.tag_member_name} />
                <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                  <Calendar className="h-4 w-4" />
                  <span>Interview slot: </span>
                  <span>{candidate.interview_date ? new Date(candidate.interview_date).toLocaleString() : "TBD"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between text-sm font-semibold">
                <span>Assignments & stage</span>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <label className="block space-y-1">
                  <span className="text-xs uppercase text-neutral-500">Advance stage</span>
                  <select
                    value={selectedStage}
                    onChange={(e) => setStage(e.target.value as CandidateStage)}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    {(stages ?? []).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 w-full"
                    disabled={selectedStage === candidate.current_stage}
                    onClick={() => stageMutation.mutate(selectedStage)}
                  >
                    Save stage
                  </Button>
                </label>

                {admin ? (
                  <div className="rounded-xl border border-dashed border-neutral-200 p-3 dark:border-neutral-800">
                    <p className="text-xs uppercase text-neutral-500">Assignments (admin)</p>
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      <SelectField
                        label="Recruiter"
                        value={recruiterId}
                        options={recruiters ?? []}
                        onChange={setRecruiterId}
                      />
                      <SelectField label="TAG" value={tagId} options={tagMembers ?? []} onChange={setTagId} />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 w-full"
                      disabled={assignMutation.isPending || (!recruiterId && !tagId)}
                      onClick={() => assignMutation.mutate()}
                    >
                      Save assignment
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500">Assignments are restricted to admins in Version&nbsp;1.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </Tabs.Content>

        <Tabs.Content value="skills">
          <BulletCard title="Skills" items={(candidate.skills as string[] | null) ?? []} />
          <BulletCard title="Certifications" items={(candidate.certifications as string[] | null) ?? []} />
        </Tabs.Content>

        <Tabs.Content value="experience">
          <JsonListCard title="Work experience" data={candidate.work_experience as Array<Record<string, unknown>> | null} />
          <JsonListCard title="Projects" data={candidate.projects as Array<Record<string, unknown>> | null} />
        </Tabs.Content>

        <Tabs.Content value="education">
          <JsonListCard title="Education" data={candidate.education as Array<Record<string, unknown>> | null} />
        </Tabs.Content>

        <Tabs.Content value="documents">
          <Card>
            <CardHeader className="text-sm font-semibold">Uploaded resumes</CardHeader>
            <CardContent className="space-y-2 text-sm">
              {candidate.resumes.length === 0 && <p className="text-neutral-500">No documents yet.</p>}
              {candidate.resumes.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-100 px-3 py-2 dark:border-neutral-800"
                >
                  <div>
                    <p className="font-medium">{r.original_filename}</p>
                    <p className="text-xs uppercase text-neutral-500">{r.extraction_status}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleDownloadResume(r.id, r.original_filename)}>
                    <ExternalLink className="mr-1 h-4 w-4" />
                    Download
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="notes">
          <InterviewNotes candidateId={candidateId} notes={candidate.notes} />
        </Tabs.Content>

        <Tabs.Content value="activity">
          <Timeline items={candidate.activity} />
        </Tabs.Content>

        <Tabs.Content value="resume">
          <Card>
            <CardHeader className="text-sm font-semibold">Resume preview</CardHeader>
            <CardContent className="space-y-2 text-sm text-neutral-700 dark:text-neutral-200">
              <p>Select a resume from the Documents tab to download source files. Parsed preview payloads will surface AI-powered viewers in upcoming releases.</p>
            </CardContent>
          </Card>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs uppercase text-neutral-500">{label}</p>
      <p className="font-medium">{value ?? "—"}</p>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; full_name: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="space-y-1 text-xs uppercase text-neutral-500">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-neutral-200 bg-white px-2 py-2 text-sm font-normal text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50"
      >
        <option value="">— optional —</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.full_name}
          </option>
        ))}
      </select>
    </label>
  );
}

function BulletCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="mb-4">
      <CardHeader className="text-sm font-semibold">{title}</CardHeader>
      <CardContent>
        {!items?.length ? (
          <p className="text-sm text-neutral-500">Nothing parsed yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {items.map((s) => (
              <span
                key={`${title}-${s}`}
                className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium dark:border-neutral-800"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function JsonListCard({ title, data }: { title: string; data: Array<Record<string, unknown>> | null }) {
  return (
    <Card className="mb-4">
      <CardHeader className="text-sm font-semibold">{title}</CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!data?.length ? (
          <p className="text-neutral-500">Awaiting extractor output.</p>
        ) : (
          data.map((row, idx) => (
            <div key={idx} className="rounded-xl border border-neutral-100 p-3 dark:border-neutral-800">
              <ul className="space-y-1">
                {Object.entries(row).map(([k, v]) => (
                  <li key={k}>
                    <span className="text-xs uppercase text-neutral-500">{k}</span>{" "}
                    <span className="font-medium">{String(v)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function InterviewNotes({
  candidateId,
  notes,
}: {
  candidateId: string;
  notes: CandidateDetail["notes"];
}) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const create = useMutation({
    mutationFn: async () => {
      await api.post(`/candidates/${candidateId}/notes`, { body: draft.trim() });
    },
    onSuccess: () => {
      setDraft("");
      toast.success("Note saved");
      void qc.invalidateQueries({ queryKey: ["candidate", candidateId] });
    },
    onError: () => toast.error("Unable to save note"),
  });

  return (
    <Card>
      <CardHeader className="text-sm font-semibold">Interview notes</CardHeader>
      <CardContent className="space-y-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm dark:border-neutral-800 dark:bg-neutral-950"
          placeholder="Capture interviewer feedback..."
        />
        <Button variant="outline" disabled={draft.trim().length === 0} onClick={() => create.mutate()}>
          Add note
        </Button>
        <div className="space-y-3">
          {notes.map((n) => (
            <div key={n.id} className="rounded-xl border border-neutral-100 p-3 text-sm dark:border-neutral-800">
              <p className="text-xs text-neutral-500">{new Date(n.created_at).toLocaleString()}</p>
              <p className="mt-2 whitespace-pre-wrap">{n.body}</p>
            </div>
          ))}
          {!notes.length && <p className="text-neutral-500">No notes yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function Timeline({ items }: { items: CandidateDetail["activity"] }) {
  return (
    <Card>
      <CardHeader className="text-sm font-semibold">Activity timeline</CardHeader>
      <CardContent className="space-y-3 text-sm">
        {items.map((a) => (
          <div key={a.id} className="flex gap-3 border-l-2 border-neutral-200 pl-3 dark:border-neutral-800">
            <div>
              <p className="text-xs text-neutral-500">{new Date(a.created_at).toLocaleString()}</p>
              <p className="font-semibold">{a.action}</p>
              {a.details && (
                <pre className="mt-1 max-h-32 overflow-auto rounded-lg bg-neutral-50 p-2 text-xs dark:bg-neutral-900">
                  {JSON.stringify(a.details, null, 2)}
                </pre>
              )}
            </div>
          </div>
        ))}
        {!items.length && <p className="text-neutral-500">No activity recorded.</p>}
      </CardContent>
    </Card>
  );
}
