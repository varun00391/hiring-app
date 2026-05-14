export type CandidateStage =
  | "Applied"
  | "Screening"
  | "Interview Scheduled"
  | "Interview Completed"
  | "Technical Round"
  | "HR Round"
  | "Offer Sent"
  | "Hired"
  | "Rejected";

export type PipelineStageRow = {
  stage: string;
  count: number;
};

export type DashboardMetric = {
  key: string;
  title: string;
  value: number;
};

export type CandidateRow = {
  id: string;
  public_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  applied_role: string | null;
  experience_years: number | null;
  current_stage: CandidateStage;
  ai_match_score: number | null;
  recruiter_id: string | null;
  assigned_tag_id: string | null;
  recruiter_name: string | null;
  tag_member_name: string | null;
  interview_date: string | null;
  status: string;
  linkedin_url: string | null;
  github_url: string | null;
  skills: unknown;
  certifications: unknown;
  education: unknown;
  work_experience: unknown;
  projects: unknown;
  parsed_metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type TagPerformanceRow = {
  member_id: string;
  member_name: string;
  specialization: string | null;
  assigned_candidates: number;
  hired_candidates: number;
  success_ratio: number;
  active_positions: number;
};

export type InterviewNote = {
  id: string;
  candidate_id: string;
  author_id: string;
  body: string;
  created_at: string;
};

export type ActivityRow = {
  id: string;
  action: string;
  details: Record<string, unknown> | null;
  actor_id: string | null;
  created_at: string;
};

export type ResumeMeta = {
  id: string;
  candidate_id: string;
  original_filename: string;
  extraction_status: string;
  created_at: string;
};

export type CandidateDetail = CandidateRow & {
  notes: InterviewNote[];
  activity: ActivityRow[];
  resumes: ResumeMeta[];
};
