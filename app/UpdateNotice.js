"use client";

import { useEffect, useState } from "react";

const VERSION = "1.4.3";
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
        <p className="update-lead">식수 등록 화면을 손가락으로 더 쉽게 누를 수 있도록 크게 재배치했습니다.</p>
        <div className="update-items">
          <div><strong>중식·석식 버튼 확대</strong><span>식사 선택 버튼을 더 크게 하고 상단에 배치해 바로 누르기 쉽게 했습니다.</span></div>
          <div><strong>인원 숫자키패드</strong><span>화면 왼쪽 아래에 숫자키패드 형태로 인원수를 빠르게 입력할 수 있습니다.</span></div>
          <div><strong>대형 등록 버튼</strong><span>오른쪽에 큰 등록 버튼을 배치해 마지막 등록 동작을 편하게 했습니다.</span></div>
        </div>
        <button type="button" className="update-now" onClick={applyUpdate}>지금 업데이트</button>
        <button type="button" className="update-later" onClick={later}>나중에 하기</button>
        <small>업데이트 버튼을 누르면 최신 화면으로 새로고침됩니다.</small>
      </section>
    </div>
  );
}
