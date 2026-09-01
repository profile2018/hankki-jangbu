"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.href = "/dashboard";
    } catch (error) {
      setMessage(error.message || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="center-shell">
      <form className="form-card" onSubmit={handleSubmit}>
        <h1>한끼장부 로그인</h1>
        <label>이메일<input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required /></label>
        <label>비밀번호<input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required /></label>
        {message && <p className="error">{message}</p>}
        <button className="btn primary" disabled={loading}>{loading ? "로그인 중..." : "로그인"}</button>
        <p className="helper"><Link href="/reset-password">비밀번호를 잊으셨나요?</Link></p>
        <p className="helper">처음이신가요? <Link href="/signup">회원가입</Link></p>
      </form>
    </main>
  );
}
