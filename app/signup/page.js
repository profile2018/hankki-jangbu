"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("82")) return `+${digits}`;
  if (digits.startsWith("0")) return `+82${digits.slice(1)}`;
  return `+82${digits}`;
}

function signupError(error) {
  const m = String(error?.message || "").toLowerCase();
  if (m.includes("phone provider disabled")) return "휴대폰번호 가입 설정을 준비 중입니다. 한끼장부 관리자에게 문의해 주세요.";
  if (m.includes("phone") && (m.includes("exists") || m.includes("registered"))) return "이미 가입된 휴대폰번호입니다. 로그인해 주세요.";
  if (m.includes("password")) return "비밀번호는 6자리 이상으로 입력해 주세요.";
  if (m.includes("rate limit") || m.includes("too many")) return "가입 요청이 많습니다. 잠시 후 다시 시도해 주세요.";
  return error?.message || "회원가입에 실패했습니다.";
}

export default function SignupPage() {
  const [form, setForm] = useState({ phone: "", password: "", confirm: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const digits = form.phone.replace(/\D/g, "");
    if (!/^01\d{8,9}$/.test(digits)) return setMessage("휴대폰번호를 정확히 입력해 주세요. 예) 010-1234-5678");
    if (form.password.length < 6) return setMessage("비밀번호는 6자리 이상으로 입력해 주세요.");
    if (form.password !== form.confirm) return setMessage("비밀번호가 일치하지 않습니다.");
    setLoading(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({ phone: normalizePhone(form.phone), password: form.password });
      if (error) throw error;
      if (!data?.session) {
        setMessage("가입 설정 확인이 필요합니다. 관리자에게 문의해 주세요.");
        return;
      }
      window.location.replace("/onboarding");
    } catch (error) {
      setMessage(signupError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="center-shell">
      <form className="form-card" onSubmit={handleSubmit}>
        <h1>30일 무료체험 회원가입</h1>
        <p className="helper">이메일 인증 없이 휴대폰번호와 비밀번호만으로 가입합니다.</p>
        <label>휴대폰번호<input type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} placeholder="010-1234-5678" required /></label>
        <label>비밀번호<input type="password" minLength="6" autoComplete="new-password" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} placeholder="6자리 이상" required /></label>
        <label>비밀번호 확인<input type="password" minLength="6" autoComplete="new-password" value={form.confirm} onChange={(e)=>setForm({...form,confirm:e.target.value})} required /></label>
        {message && <p className="notice">{message}</p>}
        <button className="btn primary" disabled={loading}>{loading ? "가입 중..." : "가입하고 식당 등록하기"}</button>
        <p className="helper">이미 가입하셨나요? <Link href="/login">로그인</Link></p>
      </form>
    </main>
  );
}
