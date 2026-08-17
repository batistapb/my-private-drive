import { NavLink, useNavigate } from "react-router-dom";

const navLinkClass = ({ isActive }) =>
  "block rounded-md px-3 py-2 text-sm font-medium transition-colors " +
  (isActive
    ? "bg-blue-600 text-white"
    : "text-neutral-700 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-700");

export default function Layout({ children }) {
  const navigate = useNavigate();

  function handleLogout() {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    navigate("/login");
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
