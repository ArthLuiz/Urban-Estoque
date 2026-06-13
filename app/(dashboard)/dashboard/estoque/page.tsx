"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";

type Product = {
  id: string;
  name: string;
  description?: string;
  sku: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  category?: string;
};

const emptyForm = { name: "", description: "", sku: "", quantity: 0, minQuantity: 0, unit: "un", category: "" };

export default function EstoquePage() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "SUPERADMIN";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  async function fetchProducts() {
    setLoading(true);
    const res = await fetch("/api/products");
    setProducts(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchProducts(); }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  // Agrupa produtos por categoria
  const grouped = filtered.reduce((acc, p) => {
    const cat = p.category || "Sem categoria";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {} as Record<string, Product[]>);

  const lowStock = filtered.filter((p) => p.quantity <= p.minQuantity).length;

  function openCreate() {
    setEditingProduct(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  }

  function openEdit(p: Product) {
    setEditingProduct(p);
    setForm({ name: p.name, description: p.description || "", sku: p.sku, quantity: p.quantity, minQuantity: p.minQuantity, unit: p.unit, category: p.category || "" });
    setError("");
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    setError("");

    const res = await fetch(
      editingProduct ? `/api/products/${editingProduct.id}` : "/api/products",
      {
        method: editingProduct ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, quantity: Number(form.quantity), minQuantity: Number(form.minQuantity) }),
      }
    );

    const data = await res.json();
    if (!res.ok) { setError(data.error || "Erro ao salvar."); setSaving(false); return; }
    setShowModal(false);
    fetchProducts();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) { setDeleteConfirm(null); fetchProducts(); }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar title="Estoque Atual" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {lowStock > 0 && (
          <div className="border-l-2 border-yellow-500 bg-yellow-950/30 px-4 py-3 mb-6">
            <p className="text-yellow-400 text-sm">{lowStock} produto(s) com estoque abaixo do mínimo</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input type="text" placeholder="Buscar produto..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 px-3 py-2 text-sm focus:outline-none focus:border-zinc-500 transition-colors" />
          <button onClick={openCreate}
            className="bg-white hover:bg-zinc-200 text-zinc-950 text-sm font-semibold px-4 py-2 transition-colors whitespace-nowrap">
            + Novo Produto
          </button>
        </div>

        {loading ? (
          <div className="text-center text-zinc-500 py-16 text-sm">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-zinc-500 py-16 text-sm">Nenhum produto encontrado.</div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([category, items]) => (
              <div key={category}>
                {/* Cabeçalho da categoria */}
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{category}</p>
                  <div className="flex-1 h-px bg-zinc-800" />
                  <p className="text-xs text-zinc-600">{items.length} item(s)</p>
                </div>

                {/* Tabela desktop */}
                <div className="hidden md:block border border-zinc-800 mb-1">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/50">
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Produto</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">SKU</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Qtd / Mín</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Status</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((p) => {
                        const low = p.quantity <= p.minQuantity;
                        return (
                          <tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/40 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium text-white">{p.name}</p>
                              {p.description && <p className="text-zinc-500 text-xs mt-0.5">{p.description}</p>}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-zinc-500">{p.sku}</td>
                            <td className="px-4 py-3">
                              <span className={`font-bold text-base ${low ? "text-red-400" : "text-white"}`}>{p.quantity}</span>
                              <span className="text-zinc-600 text-xs"> / {p.minQuantity} {p.unit}</span>
                            </td>
                            <td className="px-4 py-3">
                              {low
                                ? <span className="text-xs text-yellow-400 border-l-2 border-yellow-500 pl-2">Baixo</span>
                                : <span className="text-xs text-emerald-400 border-l-2 border-emerald-700 pl-2">OK</span>}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button onClick={() => openEdit(p)} className="text-xs text-zinc-400 hover:text-white underline underline-offset-2 transition-colors">Editar</button>
                                {isSuperAdmin && (
                                  <button onClick={() => setDeleteConfirm(p.id)} className="text-xs text-red-500 hover:text-red-400 underline underline-offset-2 transition-colors">Deletar</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Cards mobile */}
                <div className="md:hidden space-y-2 mb-1">
                  {items.map((p) => {
                    const low = p.quantity <= p.minQuantity;
                    return (
                      <div key={p.id} className="bg-zinc-900 border border-zinc-800 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-white text-sm">{p.name}</p>
                            <p className="text-xs text-zinc-500 font-mono">{p.sku}</p>
                          </div>
                          {low
                            ? <span className="text-xs text-yellow-400 border-l-2 border-yellow-500 pl-2 shrink-0">Baixo</span>
                            : <span className="text-xs text-emerald-400 border-l-2 border-emerald-700 pl-2 shrink-0">OK</span>}
                        </div>
                        <p className="text-xs text-zinc-400 mb-3">
                          Qtd: <span className={`font-bold ${low ? "text-red-400" : "text-white"}`}>{p.quantity} {p.unit}</span>
                          <span className="text-zinc-600"> / mín {p.minQuantity}</span>
                        </p>
                        <div className="flex gap-3">
                          <button onClick={() => openEdit(p)} className="text-xs text-zinc-400 hover:text-white underline underline-offset-2">Editar</button>
                          {isSuperAdmin && (
                            <button onClick={() => setDeleteConfirm(p.id)} className="text-xs text-red-500 underline underline-offset-2">Deletar</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="font-semibold text-white text-sm">{editingProduct ? "Editar Produto" : "Novo Produto"}</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white transition-colors text-lg leading-none">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Nome *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
                  placeholder="Nome do produto" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Descrição</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
                  placeholder="Descrição opcional" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">SKU *</label>
                  <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="PROD-001" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Unidade *</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-zinc-500 transition-colors">
                    <option value="un">un (unidade)</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="l">l (litro)</option>
                    <option value="ml">ml</option>
                    <option value="cx">cx (caixa)</option>
                    <option value="pc">pc (peça)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Qtd. inicial</label>
                  <input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-zinc-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Qtd. mínima</label>
                  <input type="number" min="0" value={form.minQuantity} onChange={(e) => setForm({ ...form, minQuantity: Number(e.target.value) })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-zinc-500 transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Categoria</label>
                <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
                  placeholder="Ex: Limpeza, Cozinha, Manutenção..." />
              </div>
              {error && <p className="text-red-400 text-xs border-l-2 border-red-600 pl-3 py-1">{error}</p>}
            </div>
            <div className="px-5 py-4 border-t border-zinc-800 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-zinc-700 hover:border-zinc-500 text-zinc-400 py-2 text-sm transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-white hover:bg-zinc-200 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-950 py-2 text-sm font-semibold transition-colors">
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-sm p-5">
            <h3 className="font-semibold text-white text-sm mb-1">Confirmar exclusão</h3>
            <p className="text-zinc-400 text-xs mb-5">Essa ação é permanente e não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 border border-zinc-700 text-zinc-400 py-2 text-sm transition-colors">Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-800 hover:bg-red-700 text-white py-2 text-sm font-semibold transition-colors">Deletar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
