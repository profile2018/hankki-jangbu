"use client";

import { useEffect, useState } from "react";

const VERSION = "1.3.3";
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
        <p className="update-lead">스마트폰 대시보드 화면을 새롭게 다듬었습니다.</p>
        <div className="update-items">
          <div><strong>모바일 메뉴 개선</strong><span>아이콘형 카드 메뉴로 주요 기능을 더 빠르게 찾을 수 있습니다.</span></div>
          <div><strong>오늘 현황 가독성 향상</strong><span>핵심 식수 현황과 요약 정보를 모바일 화면에 맞게 재배치했습니다.</span></div>
          <div><strong>PC 화면 유지</strong><span>기존 PC 화면 구성은 그대로 유지하면서 스마트폰 화면만 개선했습니다.</span></div>
        </div>
        <button type="button" className="update-now" onClick={applyUpdate}>지금 업데이트</button>
        <button type="button" className="update-later" onClick={later}>나중에 하기</button>
        <small>업데이트 버튼을 누르면 최신 화면으로 새로고침됩니다.</small>
      </section>
    </div>
  );
}
