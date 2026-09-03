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

function getKoreanLoginError(error) {
  const message = String(error?.message || "").toLowerCase();
  if (message.includes("email not confirmed")) return "기존 이메일 계정의 인증이 완료되지 않았습니다. 관리자에게 문의해 주세요.";
  if (message.includes("phone not confirmed")) return "휴대폰번호 계정 확인이 필요합니다. 관리자에게 문의해 주세요.";
  if (message.includes("invalid login credentials")) return "휴대폰번호(또는 기존 이메일)와 비밀번호를 다시 확인해 주세요.";
  if (message.includes("too many requests") || message.includes("rate limit")) return "로그인 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
  if (message.includes("network") || message.includes("fetch")) return "인터넷 연결을 확인한 후 다시 시도해 주세요.";
  return "로그인에 실패했습니다. 입력 내용을 확인한 후 다시 시도해 주세요.";
}

export default function LoginPage() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const supabase = createClient();
      const id = loginId.trim();
      const credentials = id.includes("@")
        ? { email: id, password }
        : { phone: normalizePhone(id), password };
      const { error } = await supabase.auth.signInWithPassword(credentials);
      if (error) throw error;
      window.location.href = "/dashboard";
    } catch (error) {
      setMessage(getKoreanLoginError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="center-shell">
      <form className="form-card" onSubmit={handleSubmit}>
        <h1>한끼장부 로그인</h1>
        <label>휴대폰번호<input type="text" inputMode="tel" autoComplete="username" value={loginId} onChange={(e)=>setLoginId(e.target.value)} placeholder="010-1234-5678" required /></label>
        <p className="helper">기존 회원은 가입할 때 사용한 이메일 주소로도 로그인할 수 있습니다.</p>
        <label>비밀번호<input type="password" autoComplete="current-password" value={password} onChange={(e)=>setPassword(e.target.value)} required /></label>
        {message && <p className="error">{message}</p>}
        <button className="btn primary" disabled={loading}>{loading ? "로그인 중..." : "로그인"}</button>
        <p className="helper">비밀번호를 잊으셨다면 한끼장부 관리자에게 문의해 주세요.</p>
        <p className="helper">처음이신가요? <Link href="/signup">회원가입</Link></p>
      </form>
    </main>
  );
}
