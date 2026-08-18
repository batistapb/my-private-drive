import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../ToastContext";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import { T } from "../styleTokens";
import { FolderIcon, FileIcon } from "../components/icons";

export default function Search() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const { showToast } = useToast();
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setResults(null);
    api
      .get(`/search?q=${encodeURIComponent(q)}`)
      .then(({ data }) => setResults(data))
      .catch(() => showToast("Falha ao buscar.", "error"));
  }, [q, showToast]);

  return (
    <Layout>
      <PageHeader title={`Resultados para "${q}"`} />

      <div className={"overflow-hidden rounded-2xl border " + T.borderSoft + " " + T.surface + " shadow-sm"}>
        {results === null && <p className={"px-5 py-8 text-center text-sm " + T.textSecondary}>Buscando...</p>}

        {results && results.length === 0 && (
          <p className={"px-5 py-8 text-center text-sm " + T.textSecondary}>Nenhum resultado encontrado.</p>
        )}

        {results && results.length > 0 && (
          <ul>
            {results.map((item) => {
              const Icon = item.type === "folder" ? FolderIcon : FileIcon;
              return (
                <li key={item.id} className={"flex items-center justify-between border-b px-5 py-3 last:border-0 " + T.borderSoft}>
                  <div className="flex flex-1 items-center gap-2.5">
                    <Icon className={"h-4 w-4 shrink-0 " + T.textTertiary} />
                    <div className="min-w-0">
                      <div className="truncate">{item.name}</div>
                      <div className={"truncate text-xs " + T.textTertiary}>
                        {["MyPrivateDrive", ...item.pathNames].join(" / ")}
                      </div>
                    </div>
                  </div>
                  <Link
                    to={item.type === "folder" ? `/folders/${item.id}` : item.parentFolderId ? `/folders/${item.parentFolderId}` : "/"}
                    className={T.btnPrimarySm}
                  >
                    Abrir
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Layout>
  );
}
