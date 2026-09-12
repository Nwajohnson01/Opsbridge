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
  createdAt: string;
  contractor?: { name: string } | null;
};

export default function CustomerPortal() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, amount }),
    });
    setTitle("");
    setDescription("");
    setAmount("");
    setSubmitting(false);
    loadRequests();
  }

  if (status !== "authenticated") return <p style={{ padding: 40 }}>Loading…</p>;

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: "0 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Customer Portal</h1>
        <button onClick={() => signOut({ callbackUrl: "/login" })}>Log out</button>
      </div>
      <p>Welcome, {session?.user?.name}</p>

      <h2>Submit a new request</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 32 }}>
        <div style={{ marginBottom: 12 }}>
          <label>Title</label><br />
          <input value={title} onChange={(e) => setTitle(e.target.value)} required style={{ width: "100%", padding: 8 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Description</label><br />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required style={{ width: "100%", padding: 8 }} rows={3} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Budget ($)</label><br />
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required style={{ width: "100%", padding: 8 }} />
        </div>
        <button type="submit" disabled={submitting} style={{ padding: "10px 16px" }}>
          {submitting ? "Submitting…" : "Submit request"}
        </button>
      </form>

      <h2>Your requests</h2>
      {requests.length === 0 && <p>No requests yet.</p>}
      {requests.map((r) => (
        <div key={r.id} style={{ border: "1px solid #ddd", padding: 16, marginBottom: 12, borderRadius: 6 }}>
          <strong>{r.title}</strong> — ${r.amount.toFixed(2)}
          <p style={{ margin: "6px 0", color: "#555" }}>{r.description}</p>
          <p style={{ margin: 0 }}>
            Status: <strong>{r.status.replace("_", " ")}</strong>
            {r.contractor && <> · Assigned to {r.contractor.name}</>}
          </p>
        </div>
      ))}
    </div>
  );
}
