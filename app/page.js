"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Home() {
  useEffect(() => {
    const search = window.location.search || "";
    const hash = window.location.hash || "";
    const params = new URLSearchParams(search);
    const isRecovery =
      params.has("code") ||
      params.get("type") === "recovery" ||
      hash.includes("type=recovery") ||
      hash.includes("access_token=");

    if (isRecovery) {
      window.location.replace(`/reset-password${search}${hash}`);
    }
  }, []);

  return (
    <main className="center-shell">
      <section className="brand-card">
        <div className="brand-mark">한끼</div>
        <h1>한끼장부</h1>
        <p>공단 한식뷔페 식수·정산 관리 서비스</p>
        <div className="stack">
          <Link className="btn primary" href="/login">로그인</Link>
          <Link className="btn secondary" href="/signup">무료체험 시작하기</Link>
        </div>
      </section>
    </main>
  );
}
