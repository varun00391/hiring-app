"use client";

import { useParams } from "next/navigation";
import { CandidateWorkspace } from "@/components/candidates/candidate-workspace";

export default function CandidateDetailRoute() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : "";
  return <CandidateWorkspace candidateId={id} />;
}
