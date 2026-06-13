import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createContextLogger, generateRequestId } from "@/lib/logger";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  sku: z.string().min(1).optional(),
  quantity: z.number().min(0).optional(),
  minQuantity: z.number().min(0).optional(),
  unit: z.string().min(1).optional(),
  category: z.string().optional(),
});

// Atualiza produto — ADMIN e SUPERADMIN
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const log = createContextLogger({ action: "products.update", requestId });

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      log.warn("Tentativa de atualização sem autenticação");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Next.js 15+: params é uma Promise, precisa de await
    const { id } = await params;

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      log.warn({ userId: session.user.id, productId: id }, "Dados inválidos ao atualizar produto");
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id },
      data: parsed.data,
    });

    log.info({ userId: session.user.id, productId: id }, "Produto atualizado com sucesso");
    return NextResponse.json(product);
  } catch (err) {
    log.error({ err }, "Erro ao atualizar produto");
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// Deleta produto — somente SUPERADMIN
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const log = createContextLogger({ action: "products.delete", requestId });

  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") {
      log.warn({ userId: session?.user.id }, "Tentativa de exclusão sem permissão");
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.product.delete({ where: { id } });

    log.info({ userId: session.user.id, productId: id }, "Produto deletado");
    return NextResponse.json({ success: true });
  } catch (err) {
    log.error({ err }, "Erro ao deletar produto");
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
