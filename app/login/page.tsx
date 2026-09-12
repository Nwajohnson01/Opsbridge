"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password.");
      setSubmitting(false);
      return;
    }

    const session = await getSession();
    const role = (session?.user as any)?.role;

    if (role === "ADMIN") router.push("/admin");
    else if (role === "CONTRACTOR") router.push("/contractor");
    else router.push("/customer");
  }

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: "0 20px" }}>
      <h1>Log in</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>Email</label><br />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%", padding: 8 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Password</label><br />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: "100%", padding: 8 }} />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={submitting} style={{ padding: "10px 16px" }}>
          {submitting ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p style={{ marginTop: 16 }}>
        No account? <a href="/signup">Sign up</a>
      </p>
    </div>
  );
}
