import { useCallback, useEffect, useState } from "react";
import { NavLink, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../ToastContext";
import { T } from "../styleTokens";
import { FolderIcon, SettingsIcon, StarIcon, TrashIcon, SearchIcon, LogoutIcon, MapIcon, PlusIcon } from "./icons";

function getEmailFromToken() {
  try {
    const token = sessionStorage.getItem("accessToken");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] || null;
  } catch {
    return null;
  }
}

function initialsFromEmail(email) {
  if (!email) return "?";
  return email.slice(0, 2).toUpperCase();
}

const navLinkClass = ({ isActive }) => (isActive ? T.navItemActive : T.navItem);

export default function Layout({ children }) {
  const navigate = useNavigate();
  const { folderId } = useParams();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [organizations, setOrganizations] = useState([]);
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [email] = useState(getEmailFromToken);

  useEffect(() => {
    setSearchTerm(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    const handle = setTimeout(() => {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    }, 300);

    return () => clearTimeout(handle);
  }, [searchTerm, navigate]);

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
    <div className={"flex min-h-screen " + T.pageBg}>
      <aside className={"sticky top-0 flex h-screen w-62 shrink-0 flex-col border-r p-3.5 " + T.borderSoft + " " + T.surface}>
        <div className="flex items-center gap-2.5 px-2 pb-5 pt-1">
          <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-[#3b6fef] to-[#8b6bff] shadow-[0_4px_10px_-2px_rgba(91,140,255,0.5)] dark:from-[#5b8cff]">
            <FolderIcon className="h-4 w-4 stroke-white" />
          </div>
          <span className="text-[15px] font-bold tracking-tight">MyPrivateDrive</span>
        </div>

        <nav className="flex flex-col gap-0.5">
          <NavLink to="/" end className={navLinkClass}>
            <FolderIcon className="h-[17px] w-[17px] shrink-0" />
            Meus Arquivos
          </NavLink>
          <NavLink to="/settings" className={navLinkClass}>
            <SettingsIcon className="h-[17px] w-[17px] shrink-0" />
            Configurações
          </NavLink>
          <NavLink to="/favorites" className={navLinkClass}>
            <StarIcon className="h-[17px] w-[17px] shrink-0" />
            Favoritos
          </NavLink>
          <NavLink to="/trash" className={navLinkClass}>
            <TrashIcon className="h-[17px] w-[17px] shrink-0" />
            Lixeira
          </NavLink>
        </nav>

        <div className="mt-5">
          <div className="flex items-center justify-between px-2.5 pb-1.5">
            <span className={"text-[11px] font-bold uppercase tracking-wider " + T.textTertiary}>Organizações</span>
            <button
              type="button"
              onClick={() => setCreatingOrg((v) => !v)}
              className={"flex h-5 w-5 items-center justify-center rounded transition-colors " + T.textTertiary + " hover:text-[#1a1d24] dark:hover:text-[#f1f3f6]"}
              aria-label="Nova organização"
            >
              <PlusIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          {creatingOrg && (
            <form onSubmit={handleCreateOrganization} className="mb-1 flex flex-col gap-1.5 px-2.5">
              <input
                type="text"
                placeholder="Nome da organização"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                autoFocus
                className={T.input}
              />
              <button type="submit" className={T.btnPrimarySm}>Criar</button>
            </form>
          )}

          <nav className="flex flex-col gap-0.5">
            {organizations.map((org) => (
              <div key={org.id} className="flex items-center gap-1">
                <NavLink
                  to={`/folders/${org.rootFolderId}`}
                  className={() => "flex flex-1 items-center gap-2.5 truncate " + (folderId === org.rootFolderId ? T.navItemActive : T.navItem)}
                >
                  <span className={"h-[18px] w-[18px] shrink-0 rounded-[5px] " + T.avatarGradientBlue} />
                  <span className="truncate">{org.name}</span>
                </NavLink>
                <NavLink
                  to={`/organizations/${org.id}/map`}
                  title="Mapa"
                  className={({ isActive }) =>
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors " +
                    (isActive ? T.accentText : T.textTertiary + " hover:text-[#1a1d24] dark:hover:text-[#f1f3f6]")
                  }
                >
                  <MapIcon className="h-3.5 w-3.5" />
                </NavLink>
              </div>
            ))}
            {organizations.length === 0 && !creatingOrg && (
              <span className={"px-2.5 py-1 text-sm " + T.textTertiary}>Nenhuma ainda</span>
            )}
          </nav>
        </div>

        <div className={"mt-auto border-t pt-3 " + T.borderSoft}>
          <div className={"flex items-center gap-2.5 rounded-lg p-1.5 " + T.surfaceHover}>
            <div className={"flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-[12.5px] font-bold text-white " + T.avatarGradientPink}>
              {initialsFromEmail(email)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[12.5px] font-semibold" title={email ?? ""}>{email ?? "..."}</div>
              <div className={"text-[11px] " + T.textTertiary}>Conta pessoal</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Sair"
              className={"ml-auto flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md transition-colors " + T.textTertiary + " hover:bg-[#e0435a]/8 hover:text-[#e0435a] dark:hover:bg-[#ff6b6b]/10 dark:hover:text-[#ff6b6b]"}
            >
              <LogoutIcon className="h-[15px] w-[15px]" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className={"sticky top-0 z-10 flex items-center gap-3.5 border-b px-6 py-3.5 backdrop-blur " + T.borderSoft + " bg-[#f4f5f7]/90 dark:bg-[#0b0d12]/88"}>
          <div className="relative max-w-md flex-1">
            <SearchIcon className={"pointer-events-none absolute left-3 top-1/2 h-[15px] w-[15px] -translate-y-1/2 " + T.textTertiary} />
            <input
              type="search"
              placeholder="Buscar arquivos e pastas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={"w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none transition-colors " + T.border + " " + T.surface + " focus:border-[#3b6fef]/40 dark:focus:border-[#5b8cff]/40 focus:ring-2 focus:ring-[#3b6fef]/8 dark:focus:ring-[#5b8cff]/12"}
            />
          </div>
        </div>

        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  );
}
