"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

type RequestItem = {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: string;
  customer: { name: string };
};

export default function ContractorPortal() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  async function loadRequests() {
    const res = await fetch("/api/requests");
    const data = await res.json();
    setRequests(data.requests || []);
  }

  useEffect(() => {
    if (status === "authenticated") loadRequests();
  }, [status]);

  async function runAction(id: string, action: string) {
    setBusyId(id);
    await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusyId(null);
    loadRequests();
  }

  if (status !== "authenticated") return <p style={{ padding: 40 }}>Loading…</p>;

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: "0 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Contractor Portal</h1>
        <button onClick={() => signOut({ callbackUrl: "/login" })}>Log out</button>
      </div>
      <p>Welcome, {session?.user?.name}</p>

      <h2>Your assigned work</h2>
      {requests.length === 0 && <p>Nothing assigned to you yet.</p>}
      {requests.map((r) => (
        <div key={r.id} style={{ border: "1px solid #ddd", padding: 16, marginBottom: 12, borderRadius: 6 }}>
          <strong>{r.title}</strong> — ${r.amount.toFixed(2)}
          <p style={{ margin: "6px 0", color: "#555" }}>{r.description}</p>
          <p style={{ margin: "0 0 10px" }}>
            Client: {r.customer?.name} · Status: <strong>{r.status.replace("_", " ")}</strong>
          </p>

          {r.status === "ASSIGNED" && (
            <button disabled={busyId === r.id} onClick={() => runAction(r.id, "START")} style={{ padding: "6px 12px" }}>
              Start work
            </button>
          )}
          {r.status === "IN_PROGRESS" && (
            <button disabled={busyId === r.id} onClick={() => runAction(r.id, "COMPLETE")} style={{ padding: "6px 12px" }}>
              Mark complete
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
