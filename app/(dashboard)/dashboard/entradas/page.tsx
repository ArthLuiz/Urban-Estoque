"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

type Product = { id: string; name: string; sku: string; unit: string; quantity: number };
type Movement = {
  id: string;
  quantity: number;
  reason?: string;
  createdAt: string;
  product: { name: string; sku: string; unit: string };
  user: { name: string };
};

export default function EntradasPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({ productId: "", quantity: 1, reason: "" });

  async function fetchData() {
    setLoading(true);
    const [prodRes, movRes] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/movements?type=ENTRADA"),
    ]);
    setProducts(await prodRes.json());
    setMovements(await movRes.json());
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function handleRegister() {
    if (!form.productId) { setError("Selecione um produto."); return; }
    setSaving(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, type: "ENTRADA", quantity: Number(form.quantity) }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Erro ao registrar entrada.");
      return;
    }

    setSuccess(`Entrada de ${form.quantity} unidades registrada com sucesso!`);
    setForm({ productId: "", quantity: 1, reason: "" });
    fetchData();
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar title="Entradas" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Formulário de registro */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900 border border-zinc-800 p-5">
              <h2 className="font-semibold text-white text-sm mb-4 pb-3 border-b border-zinc-800">
                Registrar Entrada
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Produto *</label>
                  <select
                    value={form.productId}
                    onChange={(e) => setForm({ ...form, productId: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="">Selecione...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.quantity} {p.unit} em estoque)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Quantidade *</label>
                  <input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Motivo / Observação</label>
                  <textarea
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    rows={3}
                    placeholder="Ex: Compra da distribuidora XYZ, NF 1234..."
                    className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                  />
                </div>

                {error && <p className="text-red-400 text-xs border border-red-800 bg-red-950/30 px-3 py-2">{error}</p>}
                {success && <p className="text-emerald-400 text-xs border border-emerald-800 bg-emerald-950/30 px-3 py-2">{success}</p>}

                <button
                  onClick={handleRegister}
                  disabled={saving}
                  className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-semibold py-2.5 text-sm transition-colors"
                >
                  {saving ? "Registrando..." : "Confirmar Entrada"}
                </button>
              </div>
            </div>
          </div>

          {/* Histórico de entradas */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900 border border-zinc-800">
              <div className="px-5 py-4 border-b border-zinc-800">
                <h2 className="font-semibold text-white text-sm">Histórico de Entradas</h2>
              </div>

              {loading ? (
                <div className="text-center text-zinc-500 py-12 text-sm">Carregando...</div>
              ) : movements.length === 0 ? (
                <div className="text-center text-zinc-500 py-12 text-sm">Nenhuma entrada registrada ainda.</div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {movements.map((m) => (
                    <div key={m.id} className="px-5 py-4 hover:bg-zinc-800/30 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-medium text-white text-sm">{m.product.name}</p>
                          <p className="text-xs text-zinc-500 font-mono mt-0.5">{m.product.sku}</p>
                          {m.reason && <p className="text-xs text-zinc-400 mt-1">{m.reason}</p>}
                          <p className="text-xs text-zinc-600 mt-1">por {m.user.name} · {new Date(m.createdAt).toLocaleString("pt-BR")}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-emerald-400 font-bold text-lg">+{m.quantity}</span>
                          <p className="text-xs text-zinc-500">{m.product.unit}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
