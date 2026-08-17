import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

function AccountSection() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/users/me")
      .then(({ data }) => setProfile(data))
      .catch(() => setError("Não foi possível carregar os dados da conta."));
  }, []);

  return (
    <section>
      <h2>Conta</h2>
      {error && <p className="error">{error}</p>}
      {profile && (
        <dl>
          <dt>Email</dt>
          <dd>{profile.email}</dd>
          <dt>Conta criada em</dt>
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("A nova senha e a confirmação não coincidem.");
      return;
    }

    try {
      await api.put("/users/me/password", { currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.response?.status === 400 ? "Senha atual incorreta." : "Não foi possível trocar a senha.");
    }
  }

  return (
    <section>
      <h2>Segurança</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Senha atual"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Nova senha"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirmar nova senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {error && <p className="error">{error}</p>}
        {success && <p className="success">Senha atualizada com sucesso.</p>}
        <button type="submit">Trocar senha</button>
      </form>
    </section>
  );
}

export default function Settings() {
  return (
    <div className="settings-page">
      <header>
        <h1>Configurações</h1>
        <Link to="/">← Voltar para os arquivos</Link>
      </header>

      <AccountSection />
      <SecuritySection />
    </div>
  );
}
