import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../ToastContext";
import Layout from "../components/Layout";

const primaryBtn = "rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700";

export default function Favorites() {
  const { showToast } = useToast();
  const [items, setItems] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/favorites");
      setItems(data);
    } catch {
      showToast("Não foi possível carregar os favoritos.", "error");
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Layout>
      <h1 className="mb-4 text-xl font-semibold">Favoritos</h1>

      {items === null && <p className="text-sm text-neutral-500 dark:text-neutral-400">Carregando...</p>}

      {items && items.length === 0 && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Nenhum favorito ainda.</p>
      )}

      {items && items.length > 0 && (
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-2">
              <span className="flex-1">
                {item.type === "folder" ? "📁" : "📄"} {item.name}
              </span>
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
