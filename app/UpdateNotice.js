"use client";

import { useEffect, useState } from "react";

const VERSION = "1.3.1";
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
    try {
      localStorage.setItem(STORAGE_KEY, VERSION);
    } catch {}
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
        <p className="update-lead">운영자용 무료체험 관리 기능이 추가되었습니다.</p>
        <div className="update-items">
          <div><strong>체험기간 연장</strong><span>식당별로 +7일, +15일, +30일 또는 직접 일수를 입력해 연장할 수 있습니다.</span></div>
          <div><strong>연장 사유 기록</strong><span>설치 지원이나 서비스 보상 등 연장 사유를 함께 남길 수 있습니다.</span></div>
          <div><strong>연장 이력 확인</strong><span>기존 종료일과 새 종료일, 연장 일수를 운영자 화면에서 확인합니다.</span></div>
        </div>
        <button type="button" className="update-now" onClick={applyUpdate}>지금 업데이트</button>
        <button type="button" className="update-later" onClick={later}>나중에 하기</button>
        <small>업데이트 버튼을 누르면 최신 화면으로 새로고침됩니다.</small>
      </section>
    </div>
  );
}
