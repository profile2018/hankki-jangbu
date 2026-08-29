"use client";

import { useEffect, useState } from "react";

const VERSION = "1.2.0";
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
          <div><strong>설정 메뉴 추가</strong><span>식당 정보, 입금계좌, 기본 식대와 키오스크 설정을 한 곳에서 관리합니다.</span></div>
          <div><strong>계정 정보 확인</strong><span>현재 로그인 계정과 식당 내 권한을 설정 화면에서 확인할 수 있습니다.</span></div>
          <div><strong>정산 준비 강화</strong><span>정산서에 연결할 식당·계좌 정보를 저장할 기반을 추가했습니다.</span></div>
        </div>
        <button type="button" className="update-now" onClick={applyUpdate}>지금 업데이트</button>
        <button type="button" className="update-later" onClick={later}>나중에 하기</button>
        <small>업데이트 버튼을 누르면 최신 화면으로 새로고침됩니다.</small>
      </section>
    </div>
  );
}
