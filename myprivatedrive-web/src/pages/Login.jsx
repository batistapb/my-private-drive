import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const { data } = await api.post("/auth/login", { email, password });
      sessionStorage.setItem("accessToken", data.accessToken);
      sessionStorage.setItem("refreshToken", data.refreshToken);
      navigate("/");
    } catch {
      setError("Email ou senha inválidos.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100">
      <div className="w-full max-w-sm rounded-lg border border-neutral-200 p-8 dark:border-neutral-700">
        <h1 className="mb-6 text-xl font-semibold">Entrar</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          />
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Entrar
          </button>
        </form>
        <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
          Não tem conta? <Link to="/register" className="text-blue-600 hover:underline dark:text-blue-400">Cadastre-se</Link>
        </p>
      </div>
    </div>
  );
}
