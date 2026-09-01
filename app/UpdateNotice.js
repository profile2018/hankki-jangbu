"use client";

import { useEffect, useState } from "react";

const VERSION = "1.4.2";
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
        <p className="update-lead">키오스크 PIN 입력 화면을 더 크고 터치하기 쉽게 개선했습니다.</p>
        <div className="update-items">
          <div><strong>숫자 버튼 확대</strong><span>숫자패드를 더 크고 정사각형에 가깝게 조정해 터치가 편해졌습니다.</span></div>
          <div><strong>업체 확인 버튼 확대</strong><span>확인 버튼의 높이와 글자를 키워 한눈에 보이고 누르기 쉽게 했습니다.</span></div>
          <div><strong>안내 문구 간소화</strong><span>불필요한 문구를 제거하고 “업체 PIN번호를 입력하세요.”만 크게 표시합니다.</span></div>
        </div>
        <button type="button" className="update-now" onClick={applyUpdate}>지금 업데이트</button>
        <button type="button" className="update-later" onClick={later}>나중에 하기</button>
        <small>업데이트 버튼을 누르면 최신 화면으로 새로고침됩니다.</small>
      </section>
    </div>
  );
}
