"use client";

import { useEffect, useState } from "react";

const VERSION = "1.3.6";
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
        <p className="update-lead">태블릿 가로형 키오스크 화면을 더 넓고 편하게 개선했습니다.</p>
        <div className="update-items">
          <div><strong>업체 다시 선택</strong><span>잘못 확인한 업체라면 PIN 입력 화면으로 바로 돌아갈 수 있습니다.</span></div>
          <div><strong>가로형 태블릿 최적화</strong><span>중식·석식과 인원 선택 영역을 넓혀 터치하기 편하게 배치했습니다.</span></div>
          <div><strong>인원 빠른 선택 확대</strong><span>1명부터 10명까지 한 번에 선택할 수 있도록 확장했습니다.</span></div>
        </div>
        <button type="button" className="update-now" onClick={applyUpdate}>지금 업데이트</button>
        <button type="button" className="update-later" onClick={later}>나중에 하기</button>
        <small>업데이트 버튼을 누르면 최신 화면으로 새로고침됩니다.</small>
      </section>
    </div>
  );
}
