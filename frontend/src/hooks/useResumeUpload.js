import { useCallback, useState } from "react";

const ACCEPTED = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
};

export function useResumeUpload(onParse) {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const validateFile = useCallback((candidate) => {
    const ext = candidate.name.slice(candidate.name.lastIndexOf(".")).toLowerCase();
    const allowed = [".pdf", ".doc", ".docx"];
    if (!allowed.includes(ext)) {
      throw new Error("Unsupported file type. Please upload PDF, DOC, or DOCX.");
    }
    if (candidate.size > 10 * 1024 * 1024) {
      throw new Error("File exceeds 10 MB limit.");
    }
    return candidate;
  }, []);

  const handleFile = useCallback(
    (candidate) => {
      const valid = validateFile(candidate);
      setFile(valid);
      onParse?.(valid);
    },
    [onParse, validateFile],
  );

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      setDragActive(false);
      const dropped = event.dataTransfer.files?.[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile],
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback(() => setDragActive(false), []);

  const onInputChange = useCallback(
    (event) => {
      const selected = event.target.files?.[0];
      if (selected) handleFile(selected);
    },
    [handleFile],
  );

  const reset = useCallback(() => setFile(null), []);

  return {
    file,
    dragActive,
    accept: Object.values(ACCEPTED).flat().join(","),
    onDrop,
    onDragOver,
    onDragLeave,
    onInputChange,
    reset,
  };
}
