import { useEffect, useState } from "react";
import { api } from "../api";
import { useToast } from "../ToastContext";

function isPreviewable(contentType) {
  return contentType?.startsWith("image/") || contentType === "application/pdf" || contentType === "text/plain";
}

export default function FilePreviewModal({ file, onClose }) {
  const [objectUrl, setObjectUrl] = useState(null);
  const [textContent, setTextContent] = useState(null);
  const { showToast } = useToast();

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
        if (!cancelled) showToast("Não foi possível carregar o preview.", "error");
      }
    }

    load();

    return () => {
      cancelled = true;
      if (currentUrl) window.URL.revokeObjectURL(currentUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-8"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] max-w-[90vw] overflow-auto rounded-lg bg-white p-6 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">{file.originalName}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-neutral-200 px-3 py-1 text-sm hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600"
          >
            Fechar
          </button>
        </div>

        {!isPreviewable(file.contentType) && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Preview não disponível para este tipo de arquivo — baixe para visualizar.
          </p>
        )}

        {file.contentType?.startsWith("image/") && objectUrl && (
          <img src={objectUrl} alt={file.originalName} className="max-h-[70vh] max-w-full" />
        )}
        {file.contentType === "application/pdf" && objectUrl && (
          <iframe src={objectUrl} title={file.originalName} className="h-[70vh] w-[min(80vw,800px)] border-0" />
        )}
        {file.contentType === "text/plain" && textContent !== null && (
          <pre className="max-h-[70vh] w-[min(80vw,800px)] overflow-auto whitespace-pre-wrap text-sm">{textContent}</pre>
        )}
      </div>
    </div>
  );
}
