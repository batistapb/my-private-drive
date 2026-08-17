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
      <ThemeSection />
    </Layout>
  );
}
