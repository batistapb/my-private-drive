import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import GradientWaves from "../components/GradientWaves/GradientWaves";

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-950 text-neutral-100">
      <div className="absolute inset-0">
        <GradientWaves horizonColor="#0a0f2b" waveColor="#2563eb" crestColor="#93c5fd" />
      </div>
      <div className="relative z-10 w-full max-w-sm rounded-lg border border-white/10 bg-neutral-950/50 p-8 backdrop-blur-md">
        <h1 className="mb-6 text-xl font-semibold">Entrar</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Entrar
          </button>
        </form>
        <p className="mt-4 text-sm text-neutral-400">
          Não tem conta? <Link to="/register" className="text-blue-400 transition-colors hover:text-blue-300">Cadastre-se</Link>
        </p>
      </div>
    </div>
  );
}
