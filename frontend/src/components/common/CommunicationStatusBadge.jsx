import { COMMUNICATION_STATUS_STYLES, getCommunicationStatusLabel } from "../../utils/constants.js";

export default function CommunicationStatusBadge({ status }) {
  const style = COMMUNICATION_STATUS_STYLES[status] || COMMUNICATION_STATUS_STYLES.no_communication;

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${style}`}>
      {getCommunicationStatusLabel(status)}
    </span>
  );
}
