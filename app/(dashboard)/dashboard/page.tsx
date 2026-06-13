import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isSuperAdmin = session.user.role === "SUPERADMIN";

  const [totalProdutos, entradasMes, saidasMes] = await Promise.all([
    prisma.product.count(),
    prisma.stockMovement.aggregate({
      _sum: { quantity: true },
      where: { type: "ENTRADA", createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
    }),
    prisma.stockMovement.aggregate({
      _sum: { quantity: true },
      where: { type: "SAIDA", createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
    }),
  ]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar title="Dashboard" showBack={false} userName={session.user.name ?? ""} userRole={isSuperAdmin ? "Super Admin" : "Administrador"} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white">Olá, {session.user.name}</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Resumo do mês atual</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 p-5">
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Produtos</p>
            <p className="text-3xl font-bold text-white">{totalProdutos}</p>
            <p className="text-xs text-zinc-600 mt-1">cadastrados</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-5">
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Entradas</p>
            <p className="text-3xl font-bold text-emerald-400">{entradasMes._sum.quantity ?? 0}</p>
            <p className="text-xs text-zinc-600 mt-1">unidades este mês</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-5">
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Saídas</p>
            <p className="text-3xl font-bold text-red-400">{saidasMes._sum.quantity ?? 0}</p>
            <p className="text-xs text-zinc-600 mt-1">unidades este mês</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <a href="/dashboard/estoque" className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-600 p-5 transition-colors">
            <div className="w-8 h-8 bg-zinc-800 flex items-center justify-center mb-3 group-hover:bg-zinc-700 transition-colors">
              <svg className="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <h3 className="font-semibold text-white text-sm">Estoque</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Ver e gerenciar produtos</p>
          </a>

          <a href="/dashboard/entradas" className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-600 p-5 transition-colors">
            <div className="w-8 h-8 bg-zinc-800 flex items-center justify-center mb-3 group-hover:bg-zinc-700 transition-colors">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="font-semibold text-white text-sm">Entradas</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Registrar e ver histórico</p>
          </a>

          <a href="/dashboard/saidas" className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-600 p-5 transition-colors">
            <div className="w-8 h-8 bg-zinc-800 flex items-center justify-center mb-3 group-hover:bg-zinc-700 transition-colors">
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </div>
            <h3 className="font-semibold text-white text-sm">Saídas</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Registrar e ver histórico</p>
          </a>

          <a href="/dashboard/relatorio" className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-600 p-5 transition-colors">
            <div className="w-8 h-8 bg-zinc-800 flex items-center justify-center mb-3 group-hover:bg-zinc-700 transition-colors">
              <svg className="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white text-sm">Relatório</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Exportar PDF por período</p>
          </a>
        </div>
      </main>
    </div>
  );
}
