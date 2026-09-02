"use client";

import { useEffect, useState } from "react";

const VERSION = "1.4.5";
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
        <p className="update-lead">업체 확인 후 식사 선택 화면을 더 크고 누르기 쉽게 개선했습니다.</p>
        <div className="update-items">
          <div><strong>중식·석식 버튼 세로 확대</strong><span>두 식사 버튼의 높이를 더 키워 손가락으로 누르기 편하게 했습니다.</span></div>
          <div><strong>업체명 표시 유지</strong><span>업체번호 확인 후에는 상단에 확인된 업체명이 그대로 표시됩니다.</span></div>
          <div><strong>기존 인원 입력 유지</strong><span>왼쪽 숫자키패드와 오른쪽 대형 등록 버튼 구조는 그대로 유지합니다.</span></div>
        </div>
        <button type="button" className="update-now" onClick={applyUpdate}>지금 업데이트</button>
        <button type="button" className="update-later" onClick={later}>나중에 하기</button>
        <small>업데이트 버튼을 누르면 최신 화면으로 새로고침됩니다.</small>
      </section>
    </div>
  );
}
