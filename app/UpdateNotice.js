"use client";

import { useEffect, useState } from "react";

const VERSION = "1.4.0";
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
        <p className="update-lead">비밀번호 재설정 메일의 링크를 누르면 새 비밀번호 설정 화면으로 바로 연결되도록 수정했습니다.</p>
        <div className="update-items">
          <div><strong>재설정 링크 연결 수정</strong><span>메일 링크가 첫 화면으로 열려도 재설정 정보를 감지해 새 비밀번호 화면으로 이동합니다.</span></div>
          <div><strong>복구 세션 처리 강화</strong><span>Supabase 재설정 코드와 복구 세션을 확인해 안전하게 비밀번호를 변경합니다.</span></div>
          <div><strong>변경 후 로그인 안내</strong><span>비밀번호 변경이 끝나면 로그아웃 후 새 비밀번호로 로그인하도록 안내합니다.</span></div>
        </div>
        <button type="button" className="update-now" onClick={applyUpdate}>지금 업데이트</button>
        <button type="button" className="update-later" onClick={later}>나중에 하기</button>
        <small>업데이트 버튼을 누르면 최신 화면으로 새로고침됩니다.</small>
      </section>
    </div>
  );
}
