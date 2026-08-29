"use client";

import { useEffect, useState } from "react";

const VERSION = "1.3.0";
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

  function later() {
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="update-backdrop" role="dialog" aria-modal="true" aria-labelledby="update-title">
      <section className="update-card">
        <div className="update-badge">새 버전 v{VERSION}</div>
        <h2 id="update-title">한끼장부가 업데이트되었습니다!</h2>
        <p className="update-lead">서비스 운영 기능이 추가되었습니다.</p>
        <div className="update-items">
          <div><strong>운영자 관리 추가</strong><span>슈퍼관리자 계정에서 가입 식당과 이용 상태를 확인할 수 있습니다.</span></div>
          <div><strong>식당 현황 요약</strong><span>전체 식당, 체험 중, 정상 이용, 확인 필요 식당을 한눈에 확인합니다.</span></div>
          <div><strong>관리 권한 강화</strong><span>일반 식당 계정은 운영자 관리 화면에 접근할 수 없도록 분리했습니다.</span></div>
        </div>
        <button type="button" className="update-now" onClick={applyUpdate}>지금 업데이트</button>
        <button type="button" className="update-later" onClick={later}>나중에 하기</button>
        <small>업데이트 버튼을 누르면 최신 화면으로 새로고침됩니다.</small>
      </section>
    </div>
  );
}
