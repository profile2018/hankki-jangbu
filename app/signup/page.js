"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";

export default function SignupPage() {
  const [form, setForm] = useState({ email: "", password: "", confirm: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (form.password !== form.confirm) return setMessage("비밀번호가 일치하지 않습니다.");
    setLoading(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({ email: form.email, password: form.password });
      if (error) throw error;
      setMessage("가입 요청이 완료되었습니다. 이메일 확인 후 로그인해 주세요.");
    } catch (error) {
      setMessage(error.message || "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="center-shell">
      <form className="form-card" onSubmit={handleSubmit}>
        <h1>무료체험 회원가입</h1>
        <label>이메일<input type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} required /></label>
        <label>비밀번호<input type="password" minLength="8" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} required /></label>
        <label>비밀번호 확인<input type="password" minLength="8" value={form.confirm} onChange={(e)=>setForm({...form,confirm:e.target.value})} required /></label>
        {message && <p className="notice">{message}</p>}
        <button className="btn primary" disabled={loading}>{loading ? "처리 중..." : "회원가입"}</button>
        <p className="helper">이미 가입하셨나요? <Link href="/login">로그인</Link></p>
      </form>
    </main>
  );
}
