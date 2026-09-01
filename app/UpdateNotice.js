"use client";

import { useEffect, useState } from "react";

const VERSION = "1.3.8";
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
        <p className="update-lead">거래가 끝난 거래처를 안전하게 사용중지·보관하고 필요할 때 다시 복구할 수 있습니다.</p>
        <div className="update-items">
          <div><strong>거래처 사용중지/보관</strong><span>더 이상 이용하지 않는 거래처를 키오스크에서 숨기고 보관할 수 있습니다.</span></div>
          <div><strong>기존 기록 안전 보존</strong><span>거래처를 보관해도 과거 식수 입력과 월별 정산 기록은 삭제되지 않습니다.</span></div>
          <div><strong>거래처 복구</strong><span>보관된 거래처는 언제든 복구하여 다시 사용할 수 있습니다.</span></div>
        </div>
        <button type="button" className="update-now" onClick={applyUpdate}>지금 업데이트</button>
        <button type="button" className="update-later" onClick={later}>나중에 하기</button>
        <small>업데이트 버튼을 누르면 최신 화면으로 새로고침됩니다.</small>
      </section>
    </div>
  );
}
