import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../ToastContext";
import Layout from "../components/Layout";

const primaryBtn = "rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700";

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
      <h1 className="mb-4 text-xl font-semibold">Resultados para "{q}"</h1>

      {results === null && <p className="text-sm text-neutral-500 dark:text-neutral-400">Buscando...</p>}

      {results && results.length === 0 && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Nenhum resultado encontrado.</p>
      )}

      {results && results.length > 0 && (
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
          {results.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-2">
              <div className="flex-1">
                <div>
                  {item.type === "folder" ? "📁" : "📄"} {item.name}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  {["MyPrivateDrive", ...item.pathNames].join(" / ")}
                </div>
              </div>
              <Link
                to={item.type === "folder" ? `/folders/${item.id}` : item.parentFolderId ? `/folders/${item.parentFolderId}` : "/"}
                className={primaryBtn}
              >
                Abrir
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Layout>
  );
}
