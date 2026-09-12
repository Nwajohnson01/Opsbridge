import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  let requests;
  if (role === "ADMIN") {
    requests = await prisma.request.findMany({
      include: { customer: true, contractor: true },
      orderBy: { createdAt: "desc" },
    });
  } else if (role === "CONTRACTOR") {
    requests = await prisma.request.findMany({
      where: { contractorId: userId },
      include: { customer: true, contractor: true },
      orderBy: { createdAt: "desc" },
    });
  } else {
    requests = await prisma.request.findMany({
      where: { customerId: userId },
      include: { customer: true, contractor: true },
      orderBy: { createdAt: "desc" },
    });
  }

  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if ((session.user as any).role !== "CUSTOMER") {
    return NextResponse.json({ error: "Only customers can submit requests" }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, amount } = body;

  if (!title || !description || !amount) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const newRequest = await prisma.request.create({
    data: {
      title,
      description,
      amount: parseFloat(amount),
      customerId: (session.user as any).id,
    },
  });

  await prisma.notification.create({
    data: {
      type: "EMAIL",
      message: `Request "${title}" submitted and awaiting review.`,
      requestId: newRequest.id,
      userId: (session.user as any).id,
    },
  });

  return NextResponse.json({ request: newRequest }, { status: 201 });
}
