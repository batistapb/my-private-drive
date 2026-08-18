import { useCallback, useEffect, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../ToastContext";

const navLinkClass = ({ isActive }) =>
  "block rounded-md px-3 py-2 text-sm font-medium transition-colors " +
  (isActive
    ? "bg-blue-600 text-white"
    : "text-neutral-700 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-700");

const orgLinkClass = (isActive) =>
  "block truncate rounded-md px-3 py-1.5 text-sm transition-colors " +
  (isActive
    ? "bg-blue-600 text-white"
    : "text-neutral-700 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-700");

export default function Layout({ children }) {
  const navigate = useNavigate();
  const { folderId } = useParams();
  const { showToast } = useToast();

  const [organizations, setOrganizations] = useState([]);
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");

  const loadOrganizations = useCallback(async () => {
    try {
      const { data } = await api.get("/organizations");
      setOrganizations(data);
    } catch {
      showToast("Não foi possível carregar as organizações.", "error");
    }
  }, [showToast]);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  function handleLogout() {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    navigate("/login");
  }

  async function handleCreateOrganization(event) {
    event.preventDefault();
    if (!newOrgName.trim()) return;

    try {
      const { data } = await api.post("/organizations", { name: newOrgName });
      showToast(`Organização "${newOrgName}" criada.`);
      setNewOrgName("");
      setCreatingOrg(false);
      await loadOrganizations();
      navigate(`/folders/${data.rootFolderId}`);
    } catch {
      showToast("Falha ao criar organização.", "error");
    }
  }

  return (
    <div className="flex min-h-screen bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100">
      <aside className="flex w-56 shrink-0 flex-col border-r border-neutral-200 p-4 dark:border-neutral-700">
        <span className="mb-6 px-3 text-lg font-semibold">MyPrivateDrive</span>
        <nav className="flex flex-col gap-1">
          <NavLink to="/" end className={navLinkClass}>
            Meus Arquivos
          </NavLink>
          <NavLink to="/settings" className={navLinkClass}>
            Configurações
          </NavLink>
        </nav>

        <div className="mt-6">
          <div className="flex items-center justify-between px-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Organizações
            </span>
            <button
              type="button"
              onClick={() => setCreatingOrg((v) => !v)}
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
              aria-label="Nova organização"
            >
              +
            </button>
          </div>

          {creatingOrg && (
            <form onSubmit={handleCreateOrganization} className="mt-2 flex flex-col gap-1 px-3">
              <input
                type="text"
                placeholder="Nome da organização"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                autoFocus
                className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-800"
              />
              <button type="submit" className="rounded-md bg-neutral-200 px-2 py-1 text-sm font-medium hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600">
                Criar
              </button>
            </form>
          )}

          <nav className="mt-2 flex flex-col gap-1">
            {organizations.map((org) => (
              <div key={org.id} className="flex items-center gap-1">
                <NavLink
                  to={`/folders/${org.rootFolderId}`}
                  className={() => "flex-1 " + orgLinkClass(folderId === org.rootFolderId)}
                >
                  {org.name}
                </NavLink>
                <NavLink
                  to={`/organizations/${org.id}/map`}
                  title="Mapa"
                  className={({ isActive }) =>
                    "px-1 text-sm " +
                    (isActive ? "text-blue-600 dark:text-blue-400" : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200")
                  }
                >
                  🗺
                </NavLink>
              </div>
            ))}
            {organizations.length === 0 && !creatingOrg && (
              <span className="px-3 text-sm text-neutral-500 dark:text-neutral-400">Nenhuma ainda</span>
            )}
          </nav>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-auto rounded-md px-3 py-2 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-700"
        >
          Sair
        </button>
      </aside>

      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
