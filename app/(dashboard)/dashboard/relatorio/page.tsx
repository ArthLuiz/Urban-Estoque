"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

type Movement = {
  id: string;
  type: "ENTRADA" | "SAIDA";
  quantity: number;
  reason?: string;
  destination?: string;
  recipient?: string;
  createdAt: string;
  product: { name: string; sku: string; unit: string; category?: string };
  user: { name: string };
};

export default function RelatorioPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    type: "",
    from: new Date().toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });

  async function fetchMovements() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.type) params.set("type", filter.type);
    if (filter.from) params.set("from", filter.from);
    if (filter.to) params.set("to", filter.to);
    const res = await fetch(`/api/movements?${params}`);
    setMovements(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchMovements(); }, []);

  const totalEntradas = movements.filter((m) => m.type === "ENTRADA").reduce((s, m) => s + m.quantity, 0);
  const totalSaidas = movements.filter((m) => m.type === "SAIDA").reduce((s, m) => s + m.quantity, 0);

  async function exportPDF() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 20;

    // Cabecalho
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text("Urban Estoque", pageW / 2, y, { align: "center" });
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("Relatorio de Movimentacoes", pageW / 2, y, { align: "center" });
    y += 5;
    doc.text(
      `Periodo: ${filter.from ? new Date(filter.from + "T12:00:00").toLocaleDateString("pt-BR") : "-"} ate ${filter.to ? new Date(filter.to + "T12:00:00").toLocaleDateString("pt-BR") : "-"}`,
      pageW / 2, y, { align: "center" }
    );
    y += 5;
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, pageW / 2, y, { align: "center" });
    y += 10;

    doc.setDrawColor(180);
    doc.line(15, y, pageW - 15, y);
    y += 8;

    // Resumo
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Total de registros: ${movements.length}`, 15, y); y += 6;
    doc.setTextColor(34, 139, 34);
    doc.text(`Entradas: +${totalEntradas} unidades`, 15, y); y += 6;
    doc.setTextColor(200, 50, 50);
    doc.text(`Saidas: -${totalSaidas} unidades`, 15, y); y += 10;

    doc.setDrawColor(180);
    doc.line(15, y, pageW - 15, y);
    y += 10;

    // Agrupa por tipo depois por categoria
    const tipos: ("ENTRADA" | "SAIDA")[] = ["ENTRADA", "SAIDA"];

    for (const tipo of tipos) {
      const doTipo = movements.filter((m) => m.type === tipo);
      if (doTipo.length === 0) continue;

      if (y > 240) { doc.addPage(); y = 20; }

      // Titulo do tipo
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(tipo === "ENTRADA" ? 34 : 200, tipo === "ENTRADA" ? 139 : 50, tipo === "ENTRADA" ? 34 : 50);
      doc.text(tipo === "ENTRADA" ? "ENTRADAS" : "SAIDAS", 15, y);
      y += 9;

      // Agrupa por categoria
      const porCategoria = doTipo.reduce((acc, m) => {
        const cat = m.product.category || "Sem categoria";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(m);
        return acc;
      }, {} as Record<string, Movement[]>);

      for (const [cat, items] of Object.entries(porCategoria).sort(([a], [b]) => a.localeCompare(b))) {
        if (y > 250) { doc.addPage(); y = 20; }

        // Nome da categoria
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(90);
        doc.text(cat.toUpperCase(), 15, y);
        doc.setDrawColor(210);
        doc.line(15, y + 2, pageW - 15, y + 2);
        y += 9;

        for (const m of items) {
          if (y > 262) { doc.addPage(); y = 20; }

          // Nome do produto
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(0);
          doc.text(m.product.name, 15, y);

          // Quantidade alinhada a direita
          doc.setTextColor(tipo === "ENTRADA" ? 34 : 200, tipo === "ENTRADA" ? 139 : 50, tipo === "ENTRADA" ? 34 : 50);
          doc.text(`${tipo === "ENTRADA" ? "+" : "-"}${m.quantity} ${m.product.unit}`, pageW - 15, y, { align: "right" });

          // Detalhes
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(120);
          const detalhes = [
            m.product.sku,
            m.destination ? `Destino: ${m.destination}` : null,
            m.recipient ? `Recebido por: ${m.recipient}` : null,
            m.reason || null,
          ].filter(Boolean).join("  |  ");
          if (detalhes) { doc.text(detalhes, 15, y + 5); }
          doc.text(`${m.user.name}  |  ${new Date(m.createdAt).toLocaleString("pt-BR")}`, 15, y + 10);

          y += 17;
        }
        y += 4;
      }
      y += 6;
    }

    const periodo = `${filter.from}_${filter.to}`.replace(/-/g, "");
    doc.save(`urban-estoque-${periodo}.pdf`);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar title="Relatorio" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-zinc-900 border border-zinc-800 p-5 mb-6">
          <h2 className="font-semibold text-white text-sm mb-4">Filtrar periodo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Tipo</label>
              <select value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-zinc-500 transition-colors">
                <option value="">Todos</option>
                <option value="ENTRADA">Entradas</option>
                <option value="SAIDA">Saidas</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">De</label>
              <input type="date" value={filter.from} onChange={(e) => setFilter({ ...filter, from: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-zinc-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Ate</label>
              <input type="date" value={filter.to} onChange={(e) => setFilter({ ...filter, to: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-zinc-500 transition-colors" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={fetchMovements} disabled={loading}
              className="flex-1 bg-white hover:bg-zinc-200 disabled:bg-zinc-700 text-zinc-950 disabled:text-zinc-500 font-semibold py-2 text-sm transition-colors">
              {loading ? "Buscando..." : "Buscar"}
            </button>
            <button onClick={exportPDF} disabled={movements.length === 0}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2 text-sm transition-colors border border-zinc-700">
              Exportar PDF
            </button>
          </div>
        </div>

        {movements.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-zinc-900 border border-zinc-800 p-4">
              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Registros</p>
              <p className="text-2xl font-bold text-white">{movements.length}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4">
              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Entradas</p>
              <p className="text-2xl font-bold text-emerald-400">+{totalEntradas}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4">
              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Saidas</p>
              <p className="text-2xl font-bold text-red-400">-{totalSaidas}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center text-zinc-500 py-16 text-sm">Buscando...</div>
        ) : movements.length === 0 ? (
          <div className="text-center text-zinc-500 py-16 text-sm">Nenhuma movimentacao encontrada.</div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 divide-y divide-zinc-800">
            {movements.map((m) => (
              <div key={m.id} className="px-5 py-4 hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold ${m.type === "ENTRADA" ? "text-emerald-400" : "text-red-400"}`}>{m.type}</span>
                      {m.product.category && <span className="text-xs text-zinc-600 border border-zinc-800 px-1.5 py-0.5">{m.product.category}</span>}
                    </div>
                    <p className="font-medium text-white text-sm">{m.product.name}</p>
                    <div className="flex flex-wrap gap-x-3 mt-1">
                      {m.destination && <p className="text-xs text-zinc-400">Destino: <span className="text-zinc-300">{m.destination}</span></p>}
                      {m.recipient && <p className="text-xs text-zinc-400">Recebido por: <span className="text-zinc-300">{m.recipient}</span></p>}
                      {m.reason && <p className="text-xs text-zinc-500">{m.reason}</p>}
                    </div>
                    <p className="text-xs text-zinc-600 mt-1">{m.user.name} · {new Date(m.createdAt).toLocaleString("pt-BR")}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`font-bold text-lg ${m.type === "ENTRADA" ? "text-emerald-400" : "text-red-400"}`}>
                      {m.type === "ENTRADA" ? "+" : "-"}{m.quantity}
                    </span>
                    <p className="text-xs text-zinc-500">{m.product.unit}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
