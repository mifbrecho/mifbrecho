import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-white px-4 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">MIF BRECHO Admin</h1>
        <Link href="/" className="text-sm text-white/80 hover:underline">
          Ver loja
        </Link>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-text mb-6">Painel</h2>

        <div className="grid gap-4">
          <Link
            href="/admin/produtos"
            className="bg-white rounded-2xl border border-primary-light p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition"
          >
            <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center text-2xl">
              👗
            </div>
            <div>
              <p className="font-semibold text-text">Produtos</p>
              <p className="text-sm text-text-muted">
                Cadastrar e gerenciar peças
              </p>
            </div>
          </Link>

          <Link
            href="/admin/pedidos"
            className="bg-white rounded-2xl border border-primary-light p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition"
          >
            <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center text-2xl">
              📦
            </div>
            <div>
              <p className="font-semibold text-text">Pedidos</p>
              <p className="text-sm text-text-muted">
                Ver fila de pedidos e status
              </p>
            </div>
          </Link>

          <div className="bg-white rounded-2xl border border-primary-light p-5 shadow-sm flex items-center gap-4 opacity-60">
            <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center text-2xl">
              🚚
            </div>
            <div>
              <p className="font-semibold text-text">Entregas</p>
              <p className="text-sm text-text-muted">
                Em breve — rotas do dia
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-center text-text-muted mt-10">
          Quando o Pix for pago, a peça some do estoque e o pedido aparece aqui
          automaticamente.
        </p>
      </main>
    </div>
  );
}
