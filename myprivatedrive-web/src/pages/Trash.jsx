import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { useToast } from "../ToastContext";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import { T } from "../styleTokens";
import { FolderIcon, FileIcon, RestoreIcon, TrashIcon } from "../components/icons";

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
      <PageHeader title="Lixeira" subtitle="Itens excluídos ficam aqui até você restaurar ou excluir definitivamente." />

      <div className={"overflow-hidden rounded-2xl border " + T.borderSoft + " " + T.surface + " shadow-sm"}>
        {items === null && <p className={"px-5 py-8 text-center text-sm " + T.textSecondary}>Carregando...</p>}

        {items && items.length === 0 && (
          <p className={"px-5 py-8 text-center text-sm " + T.textSecondary}>A lixeira está vazia.</p>
        )}

        {items && items.length > 0 && (
          <ul>
            {items.map((item) => {
              const Icon = item.type === "folder" ? FolderIcon : FileIcon;
              return (
                <li key={item.id} className={"flex items-center justify-between border-b px-5 py-3 last:border-0 " + T.borderSoft}>
                  <span className="flex flex-1 items-center gap-2.5">
                    <Icon className={"h-4 w-4 shrink-0 " + T.textTertiary} />
                    {item.name}
                  </span>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => handleRestore(item)} className={T.btnPrimarySm}>
                      <RestoreIcon className="h-3.5 w-3.5" />
                      Restaurar
                    </button>
                    <button type="button" onClick={() => handleDeletePermanently(item)} className={T.btnDangerSm}>
                      <TrashIcon className="h-3.5 w-3.5" />
                      Excluir definitivamente
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Layout>
  );
}
