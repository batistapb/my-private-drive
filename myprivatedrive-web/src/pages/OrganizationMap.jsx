import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../ToastContext";
import Layout from "../components/Layout";

function FolderTreeNode({ node }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <li>
      <div className="flex items-center gap-1 py-1">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="w-4 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            {expanded ? "▾" : "▸"}
          </button>
        ) : (
          <span className="w-4" />
        )}
        <Link to={`/folders/${node.id}`} className="hover:underline">
          📁 {node.name}
        </Link>
      </div>
      {hasChildren && expanded && (
        <ul className="ml-4 border-l border-neutral-200 pl-3 dark:border-neutral-700">
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
      <h1 className="mb-4 text-xl font-semibold">Mapa {tree ? `— ${tree.name}` : ""}</h1>

      {tree === null && <p className="text-sm text-neutral-500 dark:text-neutral-400">Carregando...</p>}

      {tree && (
        <ul>
          <FolderTreeNode node={tree} />
        </ul>
      )}
    </Layout>
  );
}
