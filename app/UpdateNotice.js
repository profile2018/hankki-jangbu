"use client";

import { useEffect, useState } from "react";

const VERSION = "1.1.1";
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
          <div><strong>정산 이메일 안내 개선</strong><span>발송 성공·실패 안내가 정산서 밖 중앙 팝업으로 표시되도록 개선했습니다.</span></div>
          <div><strong>PDF 이메일 발송 안정화</strong><span>발송 진행 상태를 한눈에 확인할 수 있도록 정리했습니다.</span></div>
          <div><strong>정산서 화면 정리</strong><span>안내 문구가 본문 레이아웃을 밀지 않도록 분리했습니다.</span></div>
        </div>
        <button type="button" className="update-now" onClick={applyUpdate}>지금 업데이트</button>
        <button type="button" className="update-later" onClick={later}>나중에 하기</button>
        <small>업데이트 버튼을 누르면 최신 화면으로 새로고침됩니다.</small>
      </section>
    </div>
  );
}
