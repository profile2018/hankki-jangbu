"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";

function getKoreanLoginError(error) {
  const message = String(error?.message || "").toLowerCase();

  if (message.includes("email not confirmed")) {
    return "이메일 인증이 완료되지 않았습니다. 가입하신 이메일에서 인증 메일을 확인해 주세요.";
  }
  if (message.includes("invalid login credentials")) {
    return "이메일 또는 비밀번호가 올바르지 않습니다. 다시 확인해 주세요.";
  }
  if (message.includes("too many requests") || message.includes("rate limit")) {
    return "로그인 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (message.includes("network") || message.includes("fetch")) {
    return "인터넷 연결을 확인한 후 다시 시도해 주세요.";
  }
  if (message.includes("user not found")) {
    return "등록되지 않은 이메일입니다. 이메일 주소를 확인해 주세요.";
  }

  return "로그인에 실패했습니다. 입력 내용을 확인한 후 다시 시도해 주세요.";
}

function getKoreanResendError(error) {
  const message = String(error?.message || "").toLowerCase();

  if (message.includes("rate limit") || message.includes("too many requests")) {
    return "인증메일 재발송 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (message.includes("network") || message.includes("fetch")) {
    return "인터넷 연결을 확인한 후 다시 시도해 주세요.";
  }

  return "인증메일을 다시 보내지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setNeedsConfirmation(false);
    setResendMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.href = "/dashboard";
    } catch (error) {
      const rawMessage = String(error?.message || "").toLowerCase();
      if (rawMessage.includes("email not confirmed")) setNeedsConfirmation(true);
      setMessage(getKoreanLoginError(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleResendConfirmation() {
    if (!email) {
      setResendMessage("인증메일을 받을 이메일 주소를 먼저 입력해 주세요.");
      return;
    }

    setResendLoading(true);
    setResendMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      if (error) throw error;
      setResendMessage("인증메일을 다시 보냈습니다. 받은메일함과 스팸메일함을 확인해 주세요.");
    } catch (error) {
      setResendMessage(getKoreanResendError(error));
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <main className="center-shell">
      <form className="form-card" onSubmit={handleSubmit}>
        <h1>한끼장부 로그인</h1>
        <label>이메일<input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required /></label>
        <label>비밀번호<input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required /></label>
        {message && <p className="error">{message}</p>}
        {needsConfirmation && (
          <div style={{ marginBottom: "14px" }}>
            <button
              type="button"
              className="btn"
              onClick={handleResendConfirmation}
              disabled={resendLoading}
              style={{ width: "100%" }}
            >
              {resendLoading ? "인증메일 보내는 중..." : "인증메일 다시 보내기"}
            </button>
            {resendMessage && <p className="notice" style={{ marginTop: "10px" }}>{resendMessage}</p>}
          </div>
        )}
        <button className="btn primary" disabled={loading}>{loading ? "로그인 중..." : "로그인"}</button>
        <p className="helper"><Link href="/reset-password">비밀번호를 잊으셨나요?</Link></p>
        <p className="helper">처음이신가요? <Link href="/signup">회원가입</Link></p>
      </form>
    </main>
  );
}
