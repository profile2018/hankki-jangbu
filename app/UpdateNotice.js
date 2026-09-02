"use client";

import { useEffect, useState } from "react";

const VERSION = "1.4.4";
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
        <p className="update-lead">키오스크 안내 문구를 더 쉽고 자연스럽게 정리했습니다.</p>
        <div className="update-items">
          <div><strong>업체번호 안내로 변경</strong><span>“업체 PIN번호를 입력하세요.” 대신 “업체번호를 입력하세요.”로 표시합니다.</span></div>
          <div><strong>관련 안내 문구 통일</strong><span>오류 안내와 복귀 문구도 업체번호 기준으로 맞췄습니다.</span></div>
          <div><strong>기존 기능 유지</strong><span>4자리 입력 방식과 업체 확인 기능은 그대로 사용합니다.</span></div>
        </div>
        <button type="button" className="update-now" onClick={applyUpdate}>지금 업데이트</button>
        <button type="button" className="update-later" onClick={later}>나중에 하기</button>
        <small>업데이트 버튼을 누르면 최신 화면으로 새로고침됩니다.</small>
      </section>
    </div>
  );
}
