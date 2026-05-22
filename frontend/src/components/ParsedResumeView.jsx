function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-700/80 bg-panel/80 p-5">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-500">
        {title}
      </h3>
      {children}
    </section>
  );
}

function TagList({ items }) {
  if (!items?.length) return <p className="text-sm text-muted">—</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="w-40 shrink-0 text-sm text-muted">{label}</dt>
      <dd className="text-sm text-white">{value || "—"}</dd>
    </div>
  );
}

export default function ParsedResumeView({ data }) {
  const { parsed_resume: resume, standard_format: standard, metadata } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            {resume.full_name || "Parsed Resume"}
          </h2>
          <p className="text-sm text-muted">
            Processed in {metadata.processing_time_ms}ms · {metadata.extraction_method}
          </p>
        </div>
        {standard.metadata?.completeness_score != null && (
          <div className="rounded-lg bg-brand-600/20 px-4 py-2 text-sm text-brand-100">
            Completeness: {(standard.metadata.completeness_score * 100).toFixed(0)}%
          </div>
        )}
      </div>

      {metadata.warnings?.length > 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
          <p className="font-medium">Warnings</p>
          <ul className="mt-1 list-disc pl-5">
            {metadata.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Contact">
          <dl className="space-y-2">
            <InfoRow label="Email" value={resume.email} />
            <InfoRow label="Phone" value={resume.phone} />
            <InfoRow label="Location" value={resume.location} />
            <InfoRow label="LinkedIn" value={resume.linkedin} />
            <InfoRow label="GitHub" value={resume.github} />
          </dl>
        </Section>

        <Section title="Professional">
          <dl className="space-y-2">
            <InfoRow label="Current company" value={resume.current_company} />
            <InfoRow
              label="Total experience"
              value={
                resume.total_experience_years != null
                  ? `${resume.total_experience_years} years`
                  : null
              }
            />
            <InfoRow label="Summary" value={resume.summary} />
          </dl>
        </Section>
      </div>

      <Section title="Skills">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs text-muted">Technical</p>
            <TagList items={resume.technical_skills?.length ? resume.technical_skills : resume.skills} />
          </div>
          <div>
            <p className="mb-2 text-xs text-muted">Soft skills</p>
            <TagList items={resume.soft_skills} />
          </div>
          <div>
            <p className="mb-2 text-xs text-muted">Languages</p>
            <TagList
              items={resume.languages?.map((l) =>
                l.proficiency ? `${l.language} (${l.proficiency})` : l.language,
              )}
            />
          </div>
        </div>
      </Section>

      <Section title="Experience">
        {resume.experience?.length ? (
          <ul className="space-y-4">
            {resume.experience.map((exp, i) => (
              <li key={`${exp.company}-${i}`} className="border-l-2 border-brand-600 pl-4">
                <p className="font-medium text-white">
                  {exp.title} {exp.company ? `@ ${exp.company}` : ""}
                </p>
                <p className="text-xs text-muted">
                  {[exp.start_date, exp.end_date || (exp.is_current ? "Present" : null)]
                    .filter(Boolean)
                    .join(" – ")}
                </p>
                {exp.description && (
                  <p className="mt-1 text-sm text-slate-300">{exp.description}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">—</p>
        )}
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Education">
          {resume.education?.length ? (
            <ul className="space-y-3 text-sm">
              {resume.education.map((edu, i) => (
                <li key={`${edu.institution}-${i}`}>
                  <p className="font-medium text-white">{edu.degree}</p>
                  <p className="text-muted">{edu.institution}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">—</p>
          )}
        </Section>

        <Section title="Certifications">
          {resume.certifications?.length ? (
            <ul className="space-y-2 text-sm">
              {resume.certifications.map((cert, i) => (
                <li key={`${cert.name}-${i}`}>
                  <span className="text-white">{cert.name}</span>
                  {cert.issuer && <span className="text-muted"> · {cert.issuer}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">—</p>
          )}
        </Section>
      </div>

      <Section title="Standard Format (JSON)">
        <pre className="max-h-96 overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-300">
          {JSON.stringify(standard, null, 2)}
        </pre>
      </Section>
    </div>
  );
}
