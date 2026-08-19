import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../ToastContext";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import { T } from "../styleTokens";
import { FolderIcon } from "../components/icons";

function FolderTreeNode({ node }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <li>
      <div className="flex items-center gap-1.5 py-1.5">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={"w-4 text-xs " + T.textTertiary}
          >
            {expanded ? "▾" : "▸"}
          </button>
        ) : (
          <span className="w-4" />
        )}
        <Link to={`/folders/${node.id}`} className={"flex items-center gap-2 text-sm " + T.linkHover}>
          <FolderIcon className={"h-3.5 w-3.5 shrink-0 " + T.accentText} />
          {node.name}
        </Link>
      </div>
      {hasChildren && expanded && (
        <ul className={"ml-4 border-l pl-3 " + T.borderSoft}>
          {node.children.map((child) => (
            <FolderTreeNode key={child.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function OrganizationMap() {
  const { orgId } = useParams();
  const { showToast } = useToast();
  const [tree, setTree] = useState(null);

  useEffect(() => {
    setTree(null);
    api
      .get(`/organizations/${orgId}/map`)
      .then(({ data }) => setTree(data))
      .catch(() => showToast("Não foi possível carregar o mapa.", "error"));
  }, [orgId, showToast]);

  return (
    <Layout>
      <PageHeader title={tree ? `Mapa — ${tree.name}` : "Mapa"} subtitle="Estrutura de pastas desta organização." />

      <div className={"overflow-hidden rounded-2xl border " + T.borderSoft + " " + T.surface + " p-5 shadow-sm"}>
        {tree === null && <p className={"text-sm " + T.textSecondary}>Carregando...</p>}

        {tree && (
          <ul>
            <FolderTreeNode node={tree} />
          </ul>
        )}
      </div>
    </Layout>
  );
}
