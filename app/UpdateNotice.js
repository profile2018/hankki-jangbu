"use client";

import { useEffect, useState } from "react";

const VERSION = "1.5.0";
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
        <p className="update-lead">거래처를 안전하게 보관하고 필요할 때 다시 복구할 수 있도록 관리 기능을 더 명확하게 개선했습니다.</p>
        <div className="update-items">
          <div><strong>거래처 보관 버튼 추가</strong><span>거래처 수정 화면에서 거래 종료 업체를 바로 보관 처리할 수 있습니다.</span></div>
          <div><strong>보관된 거래처 별도 표시</strong><span>보관 업체는 현재 거래처 목록과 분리되어 별도 영역에서 확인합니다.</span></div>
          <div><strong>과거 식수·정산 기록 유지</strong><span>보관해도 기존 식수와 정산 데이터는 삭제되지 않으며 언제든 복구할 수 있습니다.</span></div>
        </div>
        <button type="button" className="update-now" onClick={applyUpdate}>지금 업데이트</button>
        <button type="button" className="update-later" onClick={later}>나중에 하기</button>
        <small>업데이트 버튼을 누르면 최신 화면으로 새로고침됩니다.</small>
      </section>
    </div>
  );
}
