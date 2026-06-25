import { ExternalLink, FileAudio, FileImage, FileText, FileVideo } from "lucide-react";
import type { EvidenceItem, Incident } from "@shared/types";
import { formatDateTime } from "@renderer/utils/format";

interface EvidenceViewerPanelProps {
  evidence: EvidenceItem[];
  incidents: Incident[];
  selectedIncidentId: string;
  onSelectedIncidentChange: (incidentId: string) => void;
}

function evidenceIcon(type: EvidenceItem["type"]) {
  switch (type) {
    case "audio":
      return <FileAudio size={18} />;
    case "video":
      return <FileVideo size={18} />;
    case "image":
      return <FileImage size={18} />;
    default:
      return <FileText size={18} />;
  }
}

export function EvidenceViewerPanel({
  evidence,
  incidents,
  selectedIncidentId,
  onSelectedIncidentChange
}: EvidenceViewerPanelProps) {
  const visibleEvidence =
    selectedIncidentId === "all"
      ? evidence
      : evidence.filter((item) => item.incidentId === selectedIncidentId);

  return (
    <section className="panel evidence-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Evidence Viewer</p>
          <h2>Collected Media</h2>
        </div>
        <select
          value={selectedIncidentId}
          onChange={(event) => onSelectedIncidentChange(event.target.value)}
          aria-label="Filter evidence by incident"
        >
          <option value="all">All incidents</option>
          {incidents.map((incident) => (
            <option value={incident.id} key={incident.id}>
              {incident.title}
            </option>
          ))}
        </select>
      </div>

      <div className="evidence-grid">
        {visibleEvidence.map((item) => {
          const incident = incidents.find((candidate) => candidate.id === item.incidentId);

          return (
            <article className="evidence-card" key={item.id}>
              <div className="evidence-icon">{evidenceIcon(item.type)}</div>
              <div>
                <strong>{item.title}</strong>
                <span>{incident?.title ?? item.incidentId}</span>
                <small>
                  {item.source} · {formatDateTime(item.collectedAt)} · {item.sizeMb} MB
                </small>
              </div>
              <span className={item.verified ? "verified" : "unverified"}>
                {item.verified ? "Verified" : "Needs review"}
              </span>
              <a className="link-button" href={item.url} target="_blank" rel="noreferrer">
                <ExternalLink size={15} />
                Open
              </a>
            </article>
          );
        })}
      </div>
    </section>
  );
}
