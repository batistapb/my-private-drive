import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../ToastContext";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import { T } from "../styleTokens";
import { FolderIcon, FileIcon } from "../components/icons";

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
      <PageHeader title="Favoritos" subtitle="Arquivos e pastas marcados com estrela, de todas as organizações." />

      <div className={"overflow-hidden rounded-2xl border " + T.borderSoft + " " + T.surface + " shadow-sm"}>
        {items === null && <p className={"px-5 py-8 text-center text-sm " + T.textSecondary}>Carregando...</p>}

        {items && items.length === 0 && (
          <p className={"px-5 py-8 text-center text-sm " + T.textSecondary}>Nenhum favorito ainda.</p>
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
