"use client";

import { useEffect, useState } from "react";

const VERSION = "1.4.1";
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
        <p className="update-lead">비밀번호 재설정 화면에서 정상 링크인데도 만료 안내가 함께 보이던 문제를 수정했습니다.</p>
        <div className="update-items">
          <div><strong>잘못된 오류 문구 제거</strong><span>복구 세션이 정상 확인되면 만료 안내를 자동으로 지웁니다.</span></div>
          <div><strong>재설정 상태 판정 강화</strong><span>링크 처리 중 일시적인 오류가 있어도 유효한 세션이면 새 비밀번호 설정을 계속할 수 있습니다.</span></div>
          <div><strong>재설정 화면 안정화</strong><span>정상적인 비밀번호 변경 흐름에서는 불필요한 경고가 표시되지 않습니다.</span></div>
        </div>
        <button type="button" className="update-now" onClick={applyUpdate}>지금 업데이트</button>
        <button type="button" className="update-later" onClick={later}>나중에 하기</button>
        <small>업데이트 버튼을 누르면 최신 화면으로 새로고침됩니다.</small>
      </section>
    </div>
  );
}
