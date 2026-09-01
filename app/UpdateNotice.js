"use client";

import { useEffect, useState } from "react";

const VERSION = "1.3.9";
const STORAGE_KEY = "hankki-jangbu-version";

export default function UpdateNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const applied = localStorage.getItem(STORAGE_KEY);
      if (applied !== VERSION) setOpen(true);
    } catch {}
  }, []);

  function applyUpdate() {
    try { localStorage.setItem(STORAGE_KEY, VERSION); } catch {}
    const url = new URL(window.location.href);
    url.searchParams.set("_appv", VERSION);
    url.searchParams.set("_refresh", String(Date.now()));
    window.location.replace(url.toString());
  }

  function later() { setOpen(false); }
  if (!open) return null;

  return (
    <div className="update-backdrop" role="dialog" aria-modal="true" aria-labelledby="update-title">
      <section className="update-card">
        <div className="update-badge">새 버전 v{VERSION}</div>
        <h2 id="update-title">한끼장부가 업데이트되었습니다!</h2>
        <p className="update-lead">로그인 비밀번호를 잊었을 때 가입 이메일로 안전하게 재설정할 수 있습니다.</p>
        <div className="update-items">
          <div><strong>비밀번호 찾기</strong><span>로그인 화면에서 재설정 메일을 바로 요청할 수 있습니다.</span></div>
          <div><strong>이메일 재설정 링크</strong><span>가입한 이메일로 받은 링크를 눌러 새 비밀번호를 설정합니다.</span></div>
          <div><strong>안전한 비밀번호 변경</strong><span>기존 비밀번호를 화면에 표시하지 않고 새 비밀번호로 변경합니다.</span></div>
        </div>
        <button type="button" className="update-now" onClick={applyUpdate}>지금 업데이트</button>
        <button type="button" className="update-later" onClick={later}>나중에 하기</button>
        <small>업데이트 버튼을 누르면 최신 화면으로 새로고침됩니다.</small>
      </section>
    </div>
  );
}
