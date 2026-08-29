"use client";

import { useEffect, useState } from "react";

const VERSION = "1.3.4";
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
        <p className="update-lead">거래처별 정산 목록을 더 간결하게 개선했습니다.</p>
        <div className="update-items">
          <div><strong>정산 목록 간소화</strong><span>업체명, 총 식수, 총 청구금액만 먼저 보여줍니다.</span></div>
          <div><strong>클릭형 상세보기</strong><span>업체를 누르면 중식·석식, 담당자 정보와 정산서 발송 기능이 펼쳐집니다.</span></div>
          <div><strong>거래처 증가 대비</strong><span>업체가 많아져도 한눈에 비교하기 쉽도록 목록을 압축했습니다.</span></div>
        </div>
        <button type="button" className="update-now" onClick={applyUpdate}>지금 업데이트</button>
        <button type="button" className="update-later" onClick={later}>나중에 하기</button>
        <small>업데이트 버튼을 누르면 최신 화면으로 새로고침됩니다.</small>
      </section>
    </div>
  );
}
