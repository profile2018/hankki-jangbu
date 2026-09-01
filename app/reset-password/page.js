"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";

export default function ResetPasswordPage() {
  const [mode, setMode] = useState("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    const supabase = createClient();

    function enterUpdateMode() {
      if (!alive) return;
      setMessage("");
      setMode("update");
    }

    async function prepareRecovery() {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const type = url.searchParams.get("type");
        const hashParams = new URLSearchParams((window.location.hash || "").replace(/^#/, ""));
        const hashType = hashParams.get("type");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          enterUpdateMode();
          return;
        }

        if (type === "recovery" || hashType === "recovery" || hashParams.get("access_token")) {
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (!alive) return;
          if (data?.session) {
            enterUpdateMode();
          } else {
            setMessage("재설정 링크가 만료되었거나 올바르지 않습니다. 재설정 메일을 다시 요청해 주세요.");
            setMode("request");
          }
          return;
        }

        const { data } = await supabase.auth.getSession();
        if (!alive) return;
        if (data?.session && hashType === "recovery") {
          enterUpdateMode();
        } else {
          setMessage("");
          setMode("request");
        }
      } catch (error) {
        if (!alive) return;
        const { data } = await supabase.auth.getSession();
        if (!alive) return;
        if (data?.session) {
          enterUpdateMode();
          return;
        }
        setMessage("재설정 링크가 만료되었거나 올바르지 않습니다. 재설정 메일을 다시 요청해 주세요.");
        setMode("request");
      }
    }

    prepareRecovery();

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (!alive) return;
      if (event === "PASSWORD_RECOVERY") enterUpdateMode();
    });

    return () => {
      alive = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  async function sendResetEmail(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (error) throw error;
      setMessage("비밀번호 재설정 메일을 보냈습니다. 이메일의 링크를 눌러 새 비밀번호를 설정해 주세요.");
    } catch (error) {
      setMessage(error.message || "재설정 메일 발송에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function updatePassword(event) {
    event.preventDefault();
    setMessage("");
    if (password.length < 6) {
      setMessage("비밀번호는 6자리 이상으로 입력해 주세요.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("새 비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut();
      setMessage("비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.");
      setTimeout(() => { window.location.replace("/login"); }, 1500);
    } catch (error) {
      setMessage(error.message || "비밀번호 변경에 실패했습니다. 재설정 메일을 다시 요청해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  if (mode === "checking") {
    return <main className="center-shell"><div className="form-card"><p className="helper">비밀번호 재설정 정보를 확인하는 중...</p></div></main>;
  }

  if (mode === "update") {
    return (
      <main className="center-shell">
        <form className="form-card" onSubmit={updatePassword}>
          <h1>새 비밀번호 설정</h1>
          <p className="helper">앞으로 로그인할 새 비밀번호를 입력해 주세요.</p>
          <label>새 비밀번호<input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} minLength={6} required /></label>
          <label>새 비밀번호 확인<input type="password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} minLength={6} required /></label>
          {message && <p className={message.includes("변경되었습니다") ? "notice" : "error"}>{message}</p>}
          <button className="btn primary" disabled={loading}>{loading ? "변경 중..." : "비밀번호 변경"}</button>
        </form>
      </main>
    );
  }

  return (
    <main className="center-shell">
      <form className="form-card" onSubmit={sendResetEmail}>
        <h1>비밀번호 찾기</h1>
        <p className="helper">가입할 때 사용한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.</p>
        <label>가입 이메일<input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required /></label>
        {message && <p className={message.includes("보냈습니다") ? "notice" : "error"}>{message}</p>}
        <button className="btn primary" disabled={loading}>{loading ? "발송 중..." : "재설정 메일 보내기"}</button>
        <p className="helper"><Link href="/login">← 로그인으로 돌아가기</Link></p>
      </form>
    </main>
  );
}
