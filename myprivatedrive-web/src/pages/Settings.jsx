import { useEffect, useState } from "react";
import { api } from "../api";
import { useTheme } from "../ThemeContext";
import { useToast } from "../ToastContext";
import Layout from "../components/Layout";

const inputClass =
  "rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-800";
const buttonClass =
  "self-start rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700";

function AccountSection() {
  const [profile, setProfile] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    api
      .get("/users/me")
      .then(({ data }) => setProfile(data))
      .catch(() => showToast("Não foi possível carregar os dados da conta.", "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="mb-8 max-w-sm">
      <h2 className="mb-2 text-lg font-semibold">Conta</h2>
      {profile && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="font-medium text-neutral-500 dark:text-neutral-400">Email</dt>
          <dd>{profile.email}</dd>
          <dt className="font-medium text-neutral-500 dark:text-neutral-400">Conta criada em</dt>
          <dd>{new Date(profile.createdAt).toLocaleDateString()}</dd>
        </dl>
      )}
    </section>
  );
}

function SecuritySection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { showToast } = useToast();

  async function handleSubmit(event) {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      showToast("A nova senha e a confirmação não coincidem.", "error");
      return;
    }

    try {
      await api.put("/users/me/password", { currentPassword, newPassword });
      showToast("Senha atualizada com sucesso.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showToast(err.response?.status === 400 ? "Senha atual incorreta." : "Não foi possível trocar a senha.", "error");
    }
  }

  return (
    <section className="mb-8 max-w-sm">
      <h2 className="mb-2 text-lg font-semibold">Segurança</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="password"
          placeholder="Senha atual"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          className={inputClass}
        />
        <input
          type="password"
          placeholder="Nova senha"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className={inputClass}
        />
        <input
          type="password"
          placeholder="Confirmar nova senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className={inputClass}
        />
        <button type="submit" className={buttonClass}>Trocar senha</button>
      </form>
    </section>
  );
}

const ACTION_LABELS = {
  Login: "Login",
  Upload: "Envio de arquivo",
  Download: "Download de arquivo",
  Delete: "Exclusão",
  Rename: "Renomeação",
  PasswordChange: "Troca de senha",
};

function ActivitySection() {
  const [page, setPage] = useState(1);
  const [activity, setActivity] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    api
      .get(`/activity?page=${page}&pageSize=20`)
      .then(({ data }) => setActivity(data))
      .catch(() => showToast("Não foi possível carregar o histórico de atividade.", "error"));
  }, [page, showToast]);

  const totalPages = activity ? Math.max(1, Math.ceil(activity.totalCount / activity.pageSize)) : 1;

  return (
    <section className="mb-8 max-w-lg">
      <h2 className="mb-2 text-lg font-semibold">Atividade recente</h2>

      {activity === null && <p className="text-sm text-neutral-500 dark:text-neutral-400">Carregando...</p>}

      {activity && activity.items.length === 0 && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Nenhuma atividade registrada ainda.</p>
      )}

      {activity && activity.items.length > 0 && (
        <>
          <ul className="divide-y divide-neutral-200 text-sm dark:divide-neutral-700">
            {activity.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-2">
                <span>
                  {ACTION_LABELS[item.action] || item.action}
                  {item.targetName ? ` — ${item.targetName}` : ""}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="text-sm text-blue-600 hover:underline disabled:text-neutral-400 disabled:no-underline dark:text-blue-400 dark:disabled:text-neutral-600"
            >
              Anterior
            </button>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="text-sm text-blue-600 hover:underline disabled:text-neutral-400 disabled:no-underline dark:text-blue-400 dark:disabled:text-neutral-600"
            >
              Próxima
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function ThemeSection() {
  const { theme, toggleTheme } = useTheme();

  return (
    <section className="max-w-sm">
      <h2 className="mb-2 text-lg font-semibold">Aparência</h2>
      <label className="flex w-fit items-center gap-2 text-sm">
        <input type="checkbox" checked={theme === "light"} onChange={toggleTheme} />
        Tema claro
      </label>
    </section>
  );
}

export default function Settings() {
  return (
    <Layout>
      <h1 className="mb-6 text-2xl font-semibold">Configurações</h1>
      <AccountSection />
      <SecuritySection />
      <ActivitySection />
      <ThemeSection />
    </Layout>
  );
}
