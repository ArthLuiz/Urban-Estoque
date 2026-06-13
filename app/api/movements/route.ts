import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createContextLogger, generateRequestId } from "@/lib/logger";

const movementSchema = z.object({
  type: z.enum(["ENTRADA", "SAIDA"]),
  quantity: z.number().min(1, "Quantidade deve ser maior que zero"),
  reason: z.string().optional(),
  destination: z.string().optional(),
  recipient: z.string().optional(),
  productId: z.string().min(1, "Produto obrigatório"),
});

export async function GET(req: NextRequest) {
  const requestId = generateRequestId();
  const log = createContextLogger({ action: "movements.list", requestId });

  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: any = {};
    if (type) where.type = type;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true, unit: true, category: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    log.info({ userId: session.user.id, count: movements.length }, "Movimentações listadas");
    return NextResponse.json(movements);
  } catch (err) {
    log.error({ err }, "Erro ao listar movimentações");
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  const log = createContextLogger({ action: "movements.create", requestId });

  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const parsed = movementSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { type, quantity, reason, destination, recipient, productId } = parsed.data;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

    if (type === "SAIDA" && product.quantity < quantity) {
      return NextResponse.json({ error: `Estoque insuficiente. Disponível: ${product.quantity} ${product.unit}` }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.create({
        data: { type, quantity, reason, destination, recipient, productId, userId: session.user.id },
        include: {
          product: { select: { id: true, name: true, sku: true, unit: true, category: true } },
          user: { select: { id: true, name: true } },
        },
      });

      await tx.product.update({
        where: { id: productId },
        data: { quantity: type === "ENTRADA" ? product.quantity + quantity : product.quantity - quantity },
      });

      return movement;
    });

    log.info({ userId: session.user.id, movementId: result.id, type, quantity }, "Movimentação registrada");
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    log.error({ err }, "Erro ao registrar movimentação");
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
