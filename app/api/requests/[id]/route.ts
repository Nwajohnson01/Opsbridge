import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  const body = await request.json();
  const { action, contractorId } = body;

  const existing = await prisma.request.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  if (action === "ASSIGN") {
    if (role !== "ADMIN") return NextResponse.json({ error: "Only admins can assign" }, { status: 403 });
    if (!contractorId) return NextResponse.json({ error: "contractorId required" }, { status: 400 });

    const updated = await prisma.request.update({
      where: { id: params.id },
      data: { contractorId, status: "ASSIGNED" },
    });
    await prisma.notification.create({
      data: {
        type: "SMS",
        message: `You've been assigned to "${existing.title}".`,
        requestId: existing.id,
        userId: contractorId,
      },
    });
    return NextResponse.json({ request: updated });
  }

  if (action === "START") {
    if (role !== "CONTRACTOR" || existing.contractorId !== userId) {
      return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    }
    const updated = await prisma.request.update({
      where: { id: params.id },
      data: { status: "IN_PROGRESS" },
    });
    return NextResponse.json({ request: updated });
  }

  if (action === "COMPLETE") {
    if (role !== "CONTRACTOR" || existing.contractorId !== userId) {
      return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    }
    const updated = await prisma.request.update({
      where: { id: params.id },
      data: { status: "COMPLETED" },
    });
    await prisma.notification.create({
      data: {
        type: "EMAIL",
        message: `"${existing.title}" marked complete — awaiting your approval.`,
        requestId: existing.id,
        userId: existing.customerId,
      },
    });
    return NextResponse.json({ request: updated });
  }

  if (action === "APPROVE" || action === "REJECT") {
    if (role !== "ADMIN") return NextResponse.json({ error: "Only admins can approve/reject" }, { status: 403 });
    const updated = await prisma.request.update({
      where: { id: params.id },
      data: { status: action === "APPROVE" ? "APPROVED" : "REJECTED" },
    });
    return NextResponse.json({ request: updated });
  }

  if (action === "RELEASE_PAYMENT") {
    if (role !== "ADMIN") return NextResponse.json({ error: "Only admins can release payment" }, { status: 403 });
    if (existing.status !== "APPROVED") {
      return NextResponse.json({ error: "Request must be approved first" }, { status: 400 });
    }
    const updated = await prisma.request.update({
      where: { id: params.id },
      data: { status: "PAID" },
    });
    await prisma.notification.create({
      data: {
        type: "PAYMENT",
        message: `Payment of $${existing.amount.toFixed(2)} released for "${existing.title}".`,
        requestId: existing.id,
        userId: existing.contractorId,
      },
    });
    return NextResponse.json({ request: updated });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
