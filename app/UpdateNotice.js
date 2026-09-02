"use client";

import { useEffect, useState } from "react";

const VERSION = "1.4.9";
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
        <p className="update-lead">최고관리자 내부 운영 식당과 실제 고객 식당을 분리해 서비스 현황을 더 정확하게 관리합니다.</p>
        <div className="update-items">
          <div><strong>운영 / 테스트 식당 분리</strong><span>최고관리자 계정의 식당은 일반 가입 식당 목록과 별도로 표시합니다.</span></div>
          <div><strong>고객 통계 정확도 개선</strong><span>내부 운영 식당은 전체 식당, 체험 중, 정상 이용, 확인 필요 통계에서 제외합니다.</span></div>
          <div><strong>내부 식당 무료체험 제외</strong><span>운영용 식당에는 체험기간·사용 중단·삭제 관리 대신 식수 현황만 제공합니다.</span></div>
        </div>
        <button type="button" className="update-now" onClick={applyUpdate}>지금 업데이트</button>
        <button type="button" className="update-later" onClick={later}>나중에 하기</button>
        <small>업데이트 버튼을 누르면 최신 화면으로 새로고침됩니다.</small>
      </section>
    </div>
  );
}
