import { Link, useRouterState, useNavigate, Outlet } from "@tanstack/react-router";
import { Home, ListChecks, QrCode, MessageSquare, Sparkles, Settings, LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: Home, exact: true },
  { to: "/dashboard/quiz", label: "Mes Quiz", icon: ListChecks },
  { to: "/dashboard/qrcode", label: "QR Code", icon: QrCode },
  { to: "/dashboard/responses", label: "Réponses", icon: MessageSquare },
  { to: "/dashboard/analyse", label: "Analyse IA", icon: Sparkles },
  { to: "/dashboard/settings", label: "Paramètres", icon: Settings },
];

export function DashboardLayout() {
  const navigate = useNavigate();
  const { user, loading, signOut, merchant } = useAuth();
  const path = useRouterState({ select: r => r.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (loading || !user || !merchant) return;
    const activePlan = new Set(["starter", "growth", "pro"]);
    const plan = merchant.plan?.toLowerCase?.() ?? "";
    if (!activePlan.has(plan)) {
      navigate({ to: "/pricing" });
    }
  }, [loading, user, merchant, navigate]);

  useEffect(() => { setOpen(false); }, [path]);

  if (loading || !user || !merchant) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Chargement…</div>;
  }

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex bg-secondary">
      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-background border-r border-border flex flex-col transition-transform ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-5 border-b border-border flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <img src="/logo.png" alt="Scano" className="h-8 w-8" />
            Scano
          </Link>
          <button onClick={() => setOpen(false)} className="md:hidden p-1"><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(item => {
            const active = item.exact ? path === item.to : path.startsWith(item.to);
            return (
              <Link key={item.to} to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${active ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
                <item.icon className="h-4 w-4" />{item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="px-3 py-2 mb-2">
            <div className="text-xs text-muted-foreground">Connecté</div>
            <div className="text-sm font-semibold truncate">{merchant?.business_name || merchant?.email}</div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary">
            <LogOut className="h-4 w-4" /> Déconnexion
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between p-4 bg-background border-b border-border">
          <button onClick={() => setOpen(true)}><Menu className="h-6 w-6" /></button>
          <span className="font-bold">Scano</span>
          <span className="w-6" />
        </header>
        <main className="flex-1 p-5 md:p-10 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

