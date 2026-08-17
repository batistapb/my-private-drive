import { useEffect, useState } from "react";
import { api } from "../api";

function isPreviewable(contentType) {
  return contentType?.startsWith("image/") || contentType === "application/pdf" || contentType === "text/plain";
}

export default function FilePreviewModal({ file, onClose }) {
  const [objectUrl, setObjectUrl] = useState(null);
  const [textContent, setTextContent] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isPreviewable(file.contentType)) return;

    let currentUrl = null;
    let cancelled = false;

    async function load() {
      try {
        const response = await api.get(`/files/${file.id}/preview`, { responseType: "blob" });
        if (cancelled) return;

        if (file.contentType === "text/plain") {
          setTextContent(await response.data.text());
        } else {
          currentUrl = window.URL.createObjectURL(response.data);
          setObjectUrl(currentUrl);
        }
      } catch {
        if (!cancelled) setError("Não foi possível carregar o preview.");
      }
    }

    load();

    return () => {
      cancelled = true;
      if (currentUrl) window.URL.revokeObjectURL(currentUrl);
    };
  }, [file]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{file.originalName}</h2>
          <button type="button" onClick={onClose}>Fechar</button>
        </div>

        {!isPreviewable(file.contentType) && <p>Preview não disponível para este tipo de arquivo — baixe para visualizar.</p>}
        {error && <p className="error">{error}</p>}

        {file.contentType?.startsWith("image/") && objectUrl && (
          <img src={objectUrl} alt={file.originalName} className="preview-image" />
        )}
        {file.contentType === "application/pdf" && objectUrl && (
          <iframe src={objectUrl} title={file.originalName} className="preview-pdf" />
        )}
        {file.contentType === "text/plain" && textContent !== null && (
          <pre className="preview-text">{textContent}</pre>
        )}
      </div>
    </div>
  );
}
