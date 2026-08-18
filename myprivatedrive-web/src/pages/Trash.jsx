import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { useToast } from "../ToastContext";
import Layout from "../components/Layout";

export default function Trash() {
  const { showToast } = useToast();
  const [items, setItems] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/trash");
      setItems(data);
    } catch {
      showToast("Não foi possível carregar a lixeira.", "error");
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRestore(item) {
    try {
      await api.post(`/trash/${item.id}/restore`);
      showToast(`"${item.name}" restaurado.`);
      await load();
    } catch {
      showToast("Falha ao restaurar.", "error");
    }
  }

  async function handleDeletePermanently(item) {
    try {
      await api.delete(`/trash/${item.id}/permanent`);
      showToast(`"${item.name}" excluído permanentemente.`);
      await load();
    } catch {
      showToast("Falha ao excluir permanentemente.", "error");
    }
  }

  return (
    <Layout>
      <h1 className="mb-4 text-xl font-semibold">Lixeira</h1>

      {items === null && <p className="text-sm text-neutral-500 dark:text-neutral-400">Carregando...</p>}

      {items && items.length === 0 && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">A lixeira está vazia.</p>
      )}

      {items && items.length > 0 && (
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-2">
              <span className="flex-1">
                {item.type === "folder" ? "📁" : "📄"} {item.name}
              </span>
              <button type="button" onClick={() => handleRestore(item)} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                Restaurar
              </button>
              <button
                type="button"
                onClick={() => handleDeletePermanently(item)}
                className="ml-3 text-sm text-red-600 hover:underline dark:text-red-400"
              >
                Excluir definitivamente
              </button>
            </li>
          ))}
        </ul>
      )}
    </Layout>
  );
}
