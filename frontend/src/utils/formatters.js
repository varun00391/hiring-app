export function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatExperience(years) {
  if (years == null) return "—";
  return `${years} yrs`;
}

export function formatScore(score) {
  if (score == null) return "—";
  return `${Math.round(score)}%`;
}

import { getStatusLabel } from "./constants.js";

export function formatStatusLabel(status) {
  return getStatusLabel(status);
}

export function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
