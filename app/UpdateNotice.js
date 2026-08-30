"use client";

import { useEffect, useState } from "react";

const VERSION = "1.3.5";
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
        <p className="update-lead">모바일 월별 정산 화면의 이동 동선을 개선했습니다.</p>
        <div className="update-items">
          <div><strong>홈으로 버튼 추가</strong><span>스마트폰 월별 정산 화면에서 바로 홈으로 돌아갈 수 있습니다.</span></div>
          <div><strong>모바일 이동 편의 개선</strong><span>정산 화면을 확인한 뒤 뒤로가기 없이 주요 화면으로 이동할 수 있습니다.</span></div>
          <div><strong>기존 정산 화면 유지</strong><span>정산 월 선택과 거래처별 상세보기 구성은 그대로 유지됩니다.</span></div>
        </div>
        <button type="button" className="update-now" onClick={applyUpdate}>지금 업데이트</button>
        <button type="button" className="update-later" onClick={later}>나중에 하기</button>
        <small>업데이트 버튼을 누르면 최신 화면으로 새로고침됩니다.</small>
      </section>
    </div>
  );
}
