"use client";

import { useEffect, useState } from "react";

const VERSION = "1.4.6";
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
        <p className="update-lead">로그인 오류 안내를 이해하기 쉬운 한글 문구로 개선했습니다.</p>
        <div className="update-items">
          <div><strong>로그인 오류 한글 안내</strong><span>이메일 미인증, 비밀번호 오류 등 주요 로그인 오류를 한글로 안내합니다.</span></div>
          <div><strong>이메일 미인증 안내 개선</strong><span>인증이 필요한 경우 가입한 이메일에서 인증 메일을 확인하도록 안내합니다.</span></div>
          <div><strong>기존 키오스크 화면 유지</strong><span>중식·석식 대형 버튼과 인원 입력 화면은 그대로 유지합니다.</span></div>
        </div>
        <button type="button" className="update-now" onClick={applyUpdate}>지금 업데이트</button>
        <button type="button" className="update-later" onClick={later}>나중에 하기</button>
        <small>업데이트 버튼을 누르면 최신 화면으로 새로고침됩니다.</small>
      </section>
    </div>
  );
}
