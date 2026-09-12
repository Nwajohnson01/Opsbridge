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
  customer: { name: string; email: string };
  contractor?: { id: string; name: string } | null;
};

type Contractor = { id: string; name: string; email: string };

export default function AdminDashboard() {
  const { status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  async function loadData() {
    const [reqRes, conRes] = await Promise.all([
      fetch("/api/requests"),
      fetch("/api/users?role=CONTRACTOR"),
    ]);
    const reqData = await reqRes.json();
    const conData = await conRes.json();
    setRequests(reqData.requests || []);
    setContractors(conData.users || []);
  }

  useEffect(() => {
    if (status === "authenticated") loadData();
  }, [status]);

  async function runAction(id: string, action: string, contractorId?: string) {
    setBusyId(id);
    await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, contractorId }),
    });
    setBusyId(null);
    loadData();
  }

  if (status !== "authenticated") return <p style={{ padding: 40 }}>Loading…</p>;

  return (
    <div style={{ maxWidth: 850, margin: "40px auto", padding: "0 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Admin Dashboard</h1>
        <button onClick={() => signOut({ callbackUrl: "/login" })}>Log out</button>
      </div>

      <h2>All requests</h2>
      {requests.length === 0 && <p>No requests yet.</p>}
      {requests.map((r) => (
        <div key={r.id} style={{ border: "1px solid #ddd", padding: 16, marginBottom: 12, borderRadius: 6 }}>
          <strong>{r.title}</strong> — ${r.amount.toFixed(2)}
          <p style={{ margin: "6px 0", color: "#555" }}>{r.description}</p>
          <p style={{ margin: "0 0 10px" }}>
            Customer: {r.customer?.name} ({r.customer?.email}) · Status: <strong>{r.status.replace("_", " ")}</strong>
            {r.contractor && <> · Contractor: {r.contractor.name}</>}
          </p>

          {r.status === "PENDING" && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                id={`assign-${r.id}`}
                defaultValue=""
                style={{ padding: 6 }}
              >
                <option value="" disabled>Assign to…</option>
                {contractors.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button
                disabled={busyId === r.id}
                onClick={() => {
                  const select = document.getElementById(`assign-${r.id}`) as HTMLSelectElement;
                  if (select.value) runAction(r.id, "ASSIGN", select.value);
                }}
                style={{ padding: "6px 12px" }}
              >
                Assign
              </button>
            </div>
          )}

          {r.status === "COMPLETED" && (
            <div style={{ display: "flex", gap: 8 }}>
              <button disabled={busyId === r.id} onClick={() => runAction(r.id, "APPROVE")} style={{ padding: "6px 12px" }}>
                Approve
              </button>
              <button disabled={busyId === r.id} onClick={() => runAction(r.id, "REJECT")} style={{ padding: "6px 12px" }}>
                Reject
              </button>
            </div>
          )}

          {r.status === "APPROVED" && (
            <button disabled={busyId === r.id} onClick={() => runAction(r.id, "RELEASE_PAYMENT")} style={{ padding: "6px 12px" }}>
              Release payment
            </button>
          )}

          {r.status === "PAID" && <p style={{ color: "green", margin: 0 }}>✓ Paid</p>}
        </div>
      ))}
    </div>
  );
}
