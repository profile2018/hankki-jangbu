"use client";

import { useEffect, useState } from "react";

const VERSION = "1.4.7";
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
        <p className="update-lead">이메일 인증을 놓친 사용자도 로그인 화면에서 인증메일을 다시 받을 수 있습니다.</p>
        <div className="update-items">
          <div><strong>인증메일 다시 보내기</strong><span>이메일 미인증 계정으로 로그인하면 재발송 버튼을 바로 표시합니다.</span></div>
          <div><strong>재발송 결과 한글 안내</strong><span>성공, 요청 제한, 네트워크 오류 등을 이해하기 쉬운 한글로 안내합니다.</span></div>
          <div><strong>기존 로그인 흐름 유지</strong><span>인증이 완료된 사용자는 기존과 동일하게 대시보드로 이동합니다.</span></div>
        </div>
        <button type="button" className="update-now" onClick={applyUpdate}>지금 업데이트</button>
        <button type="button" className="update-later" onClick={later}>나중에 하기</button>
        <small>업데이트 버튼을 누르면 최신 화면으로 새로고침됩니다.</small>
      </section>
    </div>
  );
}
