import { useCallback, useEffect, useState } from "react";
import Navbar from "../components/navbar/Navbar.jsx";
import UploadSection from "../components/candidates/UploadSection.jsx";
import CandidateTable from "../components/candidates/CandidateTable.jsx";
import CandidateDrawer from "../components/candidates/CandidateDrawer.jsx";
import {
  downloadCandidateResume,
  fetchCandidate,
  fetchCandidates,
  updateCandidateStatus,
} from "../services/candidateService.js";

export default function CandidateDetailsPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sortBy, setSortBy] = useState("upload_date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [error, setError] = useState(null);

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCandidates({
        page,
        page_size: pageSize,
        search: search || undefined,
        status: statusFilter || undefined,
        role: roleFilter || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setCandidates(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter, roleFilter, sortBy, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(loadCandidates, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadCandidates, search]);

  const handleViewDetails = async (id) => {
    try {
      const candidate = await fetchCandidate(id);
      setSelectedCandidate(candidate);
      setDrawerOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusChange = async (id, interviewStatus) => {
    const previous = candidates;
    setCandidates((current) =>
      current.map((candidate) =>
        candidate.id === id
          ? { ...candidate, interview_status: interviewStatus }
          : candidate,
      ),
    );
    if (selectedCandidate?.id === id) {
      setSelectedCandidate((current) =>
        current ? { ...current, interview_status: interviewStatus } : current,
      );
    }

    setUpdatingStatusId(id);
    try {
      const updated = await updateCandidateStatus(id, { interview_status: interviewStatus });
      setCandidates((current) =>
        current.map((candidate) =>
          candidate.id === id
            ? { ...candidate, interview_status: updated.interview_status }
            : candidate,
        ),
      );
      if (selectedCandidate?.id === id) {
        setSelectedCandidate(updated);
      }
    } catch (err) {
      setCandidates(previous);
      setError(err.message);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDownload = (candidate) => {
    downloadCandidateResume(candidate.id, candidate.file_name || "resume");
  };

  return (
    <div>
      <Navbar
        title="Candidate Details"
        subtitle="Upload resumes, review parsed profiles, and manage hiring pipeline"
      />

      <div className="space-y-6 p-6 lg:p-8">
        {error && (
          <div className="rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
            {error}
          </div>
        )}

        <UploadSection onUploadComplete={loadCandidates} />

        <CandidateTable
          candidates={candidates}
          loading={loading}
          total={total}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          search={search}
          statusFilter={statusFilter}
          roleFilter={roleFilter}
          sortBy={sortBy}
          sortOrder={sortOrder}
          updatingStatusId={updatingStatusId}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onStatusFilterChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
          onRoleFilterChange={(value) => {
            setRoleFilter(value);
            setPage(1);
          }}
          onSortChange={(field, order) => {
            setSortBy(field);
            setSortOrder(order);
          }}
          onPageChange={setPage}
          onViewDetails={handleViewDetails}
          onDownload={handleDownload}
          onStatusChange={handleStatusChange}
        />
      </div>

      <CandidateDrawer
        open={drawerOpen}
        candidate={selectedCandidate}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedCandidate(null);
        }}
        onUpdated={loadCandidates}
      />
    </div>
  );
}
