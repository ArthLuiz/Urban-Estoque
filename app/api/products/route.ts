import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createContextLogger, generateRequestId } from "@/lib/logger";

const productSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  description: z.string().optional(),
  sku: z.string().min(1, "SKU obrigatório"),
  quantity: z.number().min(0),
  minQuantity: z.number().min(0),
  unit: z.string().min(1),
  category: z.string().optional(),
});

// Lista todos os produtos — ADMIN e SUPERADMIN
export async function GET() {
  const requestId = generateRequestId();
  const log = createContextLogger({ action: "products.list", requestId });

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      log.warn("Tentativa de acesso não autorizado");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
    log.info({ userId: session.user.id, count: products.length }, "Produtos listados");
    return NextResponse.json(products);
  } catch (err) {
    log.error({ err }, "Erro ao listar produtos");
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// Cadastra novo produto — ADMIN e SUPERADMIN
export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  const log = createContextLogger({ action: "products.create", requestId });

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      log.warn("Tentativa de criação sem autenticação");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      log.warn({ userId: session.user.id, errors: parsed.error.errors }, "Dados inválidos ao criar produto");
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    // Verifica se já existe um produto com esse SKU antes de criar
    const existing = await prisma.product.findUnique({ where: { sku: parsed.data.sku } });
    if (existing) {
      log.warn({ userId: session.user.id, sku: parsed.data.sku }, "SKU duplicado");
      return NextResponse.json({ error: "SKU já cadastrado" }, { status: 400 });
    }

    const product = await prisma.product.create({ data: parsed.data });
    log.info({ userId: session.user.id, productId: product.id }, "Produto criado com sucesso");
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    log.error({ err }, "Erro ao criar produto");
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
