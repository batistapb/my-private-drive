import { useEffect, useState } from "react";
import { api } from "../api";
import { useTheme } from "../ThemeContext";
import { useToast } from "../ToastContext";
import Layout from "../components/Layout";
import Card from "../components/Card";
import { T } from "../styleTokens";
import {
  UserIcon,
  ShieldIcon,
  ClockIcon,
  SunIcon,
  EyeIcon,
  EyeOffIcon,
  CheckIcon,
  UploadIcon,
  DownloadIcon,
  TrashIcon,
  EditIcon,
} from "../components/icons";

function initialsFromEmail(email) {
  if (!email) return "?";
  return email.slice(0, 2).toUpperCase();
}

function PasswordField({ label, placeholder, value, onChange }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="mb-3.5">
      <label className={"mb-1.5 block text-xs font-semibold " + T.textSecondary}>{label}</label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
          className={T.input + " pr-10"}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className={"absolute right-2.5 top-1/2 -translate-y-1/2 " + T.textTertiary}
          tabIndex={-1}
        >
          {visible ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

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
    <Card icon={<UserIcon className="h-4 w-4" />} title="Conta" description="Suas informações básicas de identificação">
      {profile && (
        <>
          <div className="flex items-center gap-3.5 pb-4 pt-1">
            <div className={"flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold text-white shadow-[0_4px_14px_-2px_rgba(168,85,247,0.4)] " + T.avatarGradientPink}>
              {initialsFromEmail(profile.email)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[15px] font-semibold">{profile.email}</div>
              <div className={"text-xs " + T.textSecondary}>Conta pessoal</div>
            </div>
          </div>
          <div className={"flex items-center justify-between border-t py-3 " + T.borderSoft}>
            <span className={"text-sm font-medium " + T.textSecondary}>Conta criada em</span>
            <span className="text-sm font-semibold">{new Date(profile.createdAt).toLocaleDateString()}</span>
          </div>
        </>
      )}
    </Card>
  );
}

function SecuritySection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { showToast } = useToast();

  function reset() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      showToast("A nova senha e a confirmação não coincidem.", "error");
      return;
    }

    try {
      await api.put("/users/me/password", { currentPassword, newPassword });
      showToast("Senha atualizada com sucesso.");
      reset();
    } catch (err) {
      showToast(err.response?.status === 400 ? "Senha atual incorreta." : "Não foi possível trocar a senha.", "error");
    }
  }

  return (
    <Card icon={<ShieldIcon className="h-4 w-4" />} title="Segurança" description="Atualize sua senha de acesso">
      <form onSubmit={handleSubmit}>
        <PasswordField label="Senha atual" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        <PasswordField label="Nova senha" placeholder="Mínimo de 8 caracteres" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <PasswordField label="Confirmar nova senha" placeholder="Repita a nova senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        <p className={"-mt-2 mb-3.5 text-xs " + T.textTertiary}>Use letras, números e símbolos para uma senha mais forte.</p>
        <div className="flex items-center gap-2.5">
          <button type="submit" className={T.btnPrimary}>
            <CheckIcon className="h-3.5 w-3.5" />
            Trocar senha
          </button>
          <button type="button" onClick={reset} className={T.btnGhost}>Cancelar</button>
        </div>
      </form>
    </Card>
  );
}

const ACTION_LABELS = {
  Login: "Login",
  Upload: "Envio",
  Download: "Download",
  Delete: "Exclusão",
  Rename: "Renomeação",
  PasswordChange: "Troca de senha",
};

const ACTION_STYLE = {
  Upload: { Icon: UploadIcon, cls: T.successText, bg: T.successSoftBg },
  Download: { Icon: DownloadIcon, cls: T.accentText, bg: T.accentSoftBg },
  Delete: { Icon: TrashIcon, cls: T.dangerText, bg: T.dangerSoftBg },
  Rename: { Icon: EditIcon, cls: T.textSecondary, bg: "bg-[#5b6270]/8 dark:bg-[#9aa3b2]/12" },
  Login: { Icon: UserIcon, cls: T.textSecondary, bg: "bg-[#5b6270]/8 dark:bg-[#9aa3b2]/12" },
  PasswordChange: { Icon: ShieldIcon, cls: T.textSecondary, bg: "bg-[#5b6270]/8 dark:bg-[#9aa3b2]/12" },
};

function relativeTime(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "agora há pouco";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours} h`;
  return `há ${Math.floor(hours / 24)} d`;
}

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
    <Card icon={<ClockIcon className="h-4 w-4" />} title="Atividade recente" description="Últimas ações realizadas na sua conta">
      {activity === null && <p className={"text-sm " + T.textSecondary}>Carregando...</p>}

      {activity && activity.items.length === 0 && (
        <p className={"text-sm " + T.textSecondary}>Nenhuma atividade registrada ainda.</p>
      )}

      {activity && activity.items.length > 0 && (
        <>
          <ul>
            {activity.items.map((item) => {
              const style = ACTION_STYLE[item.action] || ACTION_STYLE.Rename;
              const Icon = style.Icon;
              return (
                <li key={item.id} className={"flex items-start gap-3 border-b py-2.5 last:border-0 " + T.borderSoft}>
                  <div className={"mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg " + style.bg}>
                    <Icon className={"h-3.5 w-3.5 " + style.cls} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">
                      {ACTION_LABELS[item.action] || item.action}
                      {item.targetName && <> de <b className="font-semibold">{item.targetName}</b></>}
                    </div>
                    <div className={"text-[11.5px] " + T.textTertiary}>{new Date(item.createdAt).toLocaleString()}</div>
                  </div>
                  <div className={"whitespace-nowrap pt-0.5 text-[11.5px] " + T.textTertiary}>{relativeTime(item.createdAt)}</div>
                </li>
              );
            })}
          </ul>
          <div className={"flex items-center justify-center gap-3.5 pt-4 text-xs " + T.textTertiary}>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className={T.accentText + " disabled:cursor-not-allowed disabled:text-current disabled:opacity-40"}
            >
              ← Anterior
            </button>
            <span>Página {page} de {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className={T.accentText + " disabled:cursor-not-allowed disabled:text-current disabled:opacity-40"}
            >
              Próxima →
            </button>
          </div>
        </>
      )}
    </Card>
  );
}

function ThemeSection() {
  const { theme, setTheme } = useTheme();

  return (
    <Card icon={<SunIcon className="h-4 w-4" />} title="Aparência" description="Escolha como o MyPrivateDrive deve parecer">
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={"flex-1 rounded-xl border-2 p-2.5 text-center transition-colors " + (theme === "dark" ? "border-[#3b6fef] dark:border-[#5b8cff]" : T.border)}
        >
          <div className="mb-2 h-12 rounded-lg bg-gradient-to-br from-[#12151c] to-[#1c212b]" />
          <span className="text-xs font-semibold">Escuro</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={"flex-1 rounded-xl border-2 p-2.5 text-center transition-colors " + (theme === "light" ? "border-[#3b6fef] dark:border-[#5b8cff]" : T.border)}
        >
          <div className="mb-2 h-12 rounded-lg border border-[#e4e6eb] bg-gradient-to-br from-white to-[#eef0f4]" />
          <span className="text-xs font-semibold">Claro</span>
        </button>
      </div>
    </Card>
  );
}

export default function Settings() {
  return (
    <Layout>
      <div className="mx-auto max-w-3xl">
        <div className="mb-7">
          <div className={"mb-1.5 text-xs " + T.textTertiary}>MyPrivateDrive / Configurações</div>
          <h1 className="text-[26px] font-bold tracking-tight">Configurações</h1>
          <p className={"mt-1.5 text-sm " + T.textSecondary}>Gerencie sua conta, segurança e preferências de aparência.</p>
        </div>
        <AccountSection />
        <SecuritySection />
        <ActivitySection />
        <ThemeSection />
      </div>
    </Layout>
  );
}
