"use client";

import { useEffect, useState } from "react";

const VERSION = "1.3.7";
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
        <p className="update-lead">키오스크가 다양한 태블릿 화면 비율에 자동으로 맞춰지도록 개선했습니다.</p>
        <div className="update-items">
          <div><strong>PIN 화면 자동 최적화</strong><span>가로폭과 세로높이에 맞춰 숫자패드와 글자 크기, 여백을 자동 조정합니다.</span></div>
          <div><strong>낮은 와이드 화면 대응</strong><span>세로 공간이 좁은 모니터에서는 요소 간격을 줄여 화면 안에 자연스럽게 배치합니다.</span></div>
          <div><strong>대형 화면 대응</strong><span>큰 터치모니터에서는 지나치게 늘어나지 않도록 적정 최대 폭을 유지합니다.</span></div>
        </div>
        <button type="button" className="update-now" onClick={applyUpdate}>지금 업데이트</button>
        <button type="button" className="update-later" onClick={later}>나중에 하기</button>
        <small>업데이트 버튼을 누르면 최신 화면으로 새로고침됩니다.</small>
      </section>
    </div>
  );
}
