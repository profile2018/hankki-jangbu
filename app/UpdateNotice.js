"use client";

import { useEffect, useState } from "react";

const VERSION = "1.1.0";
const STORAGE_KEY = "hankki-jangbu-version";

export default function UpdateNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const applied = localStorage.getItem(STORAGE_KEY);
      if (applied !== VERSION) setOpen(true);
    } catch {
      // localStorage를 사용할 수 없는 환경에서는 업데이트 안내를 생략합니다.
    }
  }, []);

  function applyUpdate() {
    try {
      localStorage.setItem(STORAGE_KEY, VERSION);
    } catch {}
    window.location.reload();
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
        <p className="update-lead">더 편리한 식수 관리를 위해 최신 버전을 사용해 주세요.</p>
        <div className="update-items">
          <div><strong>키오스크 사용성 개선</strong><span>화면에서 바로 입력할 수 있는 터치 숫자패드를 추가했습니다.</span></div>
          <div><strong>거래처 입력 안정성 향상</strong><span>거래처 등록·수정 시 연속 입력이 끊기지 않도록 개선했습니다.</span></div>
          <div><strong>정산 이메일 기능 준비</strong><span>PDF 정산서를 이메일로 발송할 수 있는 기능을 추가했습니다.</span></div>
        </div>
        <button type="button" className="update-now" onClick={applyUpdate}>지금 업데이트</button>
        <button type="button" className="update-later" onClick={later}>나중에 하기</button>
        <small>업데이트 버튼을 누르면 최신 화면으로 새로고침됩니다.</small>
      </section>
    </div>
  );
}
