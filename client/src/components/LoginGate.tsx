import { FormEvent, ReactNode, useState } from "react";
import { Truck } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function LoginGate({ children }: { children: ReactNode }) {
  const utils = trpc.useUtils();
  const me = trpc.auth.me.useQuery(undefined, { retry: false });
  const [name, setName] = useState(() => { try { return localStorage.getItem("frota-nome") ?? ""; } catch { return ""; } });
  const [password, setPassword] = useState("");
  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      try { localStorage.setItem("frota-nome", name); } catch { /* sem armazenamento */ }
      await utils.invalidate();
    },
  });

  if (me.isLoading) return <div className="loading-screen">Carregando…</div>;
  if (me.data?.user) return <>{children}</>;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    login.mutate({ name, password });
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <div className="brand login-brand"><span className="brand-mark"><Truck size={22} /></span><div><b>Frota</b><small>MANUTENÇÃO</small></div></div>
        <h1>Entrar</h1>
        <p className="hint">Use a senha da equipe para acessar o controle de manutenção.</p>
        <label className="field"><span>Seu nome</span><input value={name} onChange={e => setName(e.target.value)} autoComplete="name" required /></label>
        <label className="field"><span>Senha</span><input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required /></label>
        {login.error && <p className="login-error">{login.error.message}</p>}
        <button className="primary-button" disabled={login.isPending}>{login.isPending ? "Entrando…" : "Entrar"}</button>
      </form>
    </div>
  );
}
