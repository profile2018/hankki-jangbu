"use client";

import { useEffect, useState } from "react";

const VERSION = "1.3.2";
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
        <p className="update-lead">운영자용 식당 보관·복구 기능을 개선했습니다.</p>
        <div className="update-items">
          <div><strong>가입 식당 목록 정리</strong><span>삭제/보관 처리한 식당은 일반 가입 식당 목록에서 제외됩니다.</span></div>
          <div><strong>보관된 식당 분리</strong><span>보관된 식당을 별도 영역에서 확인할 수 있습니다.</span></div>
          <div><strong>안전한 복구</strong><span>보관된 식당은 데이터 삭제 없이 언제든 다시 복구할 수 있습니다.</span></div>
        </div>
        <button type="button" className="update-now" onClick={applyUpdate}>지금 업데이트</button>
        <button type="button" className="update-later" onClick={later}>나중에 하기</button>
        <small>업데이트 버튼을 누르면 최신 화면으로 새로고침됩니다.</small>
      </section>
    </div>
  );
}
