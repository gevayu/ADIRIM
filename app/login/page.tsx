"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "כניסה נכשלה");
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "כניסה נכשלה");
      setBusy(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420, marginTop: 80 }}>
      <div className="panel">
        <h2>כניסת עורך</h2>
        <p className="sub">הזן סיסמה כדי לפתוח עריכה. הצפייה ברשימה פתוחה לכולם ללא סיסמה.</p>
        <form onSubmit={submit}>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="סיסמה"
            style={{ width: "100%", border: "2px solid #ffcccc", borderRadius: 8, padding: "10px 12px", fontFamily: "inherit", fontSize: "1em" }}
          />
          {error && <div className="error-msg">{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={busy || !password} style={{ marginTop: 14, width: "100%" }}>
            {busy ? "נכנס…" : "כניסה"}
          </button>
        </form>
      </div>
    </div>
  );
}
