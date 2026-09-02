"use client";

import { useEffect, useState } from "react";

const VERSION = "1.5.3";
const STORAGE_KEY = "hankki-jangbu-version";
const CHECK_INTERVAL = 5 * 60 * 1000;

export default function UpdateNotice() {
  const [open, setOpen] = useState(false);
  const [latestVersion, setLatestVersion] = useState(VERSION);

  useEffect(() => {
    if (window.location.pathname.startsWith("/kiosk")) {
      setOpen(false);
      return;
    }

    let timer;
    let stopped = false;

    function showIfNeeded(version) {
      try {
        const applied = localStorage.getItem(STORAGE_KEY);
        if (applied !== version) {
          setLatestVersion(version);
          setOpen(true);
        }
      } catch {
        setLatestVersion(version);
        setOpen(true);
      }
    }

    async function checkLatestVersion() {
      try {
        const response = await fetch(`/app-version.json?_=${Date.now()}`, {
          cache: "no-store",
          headers: { "cache-control": "no-cache" },
        });
        if (!response.ok) return;
        const data = await response.json();
        const remoteVersion = String(data?.version || "").trim();
        if (!stopped && remoteVersion && remoteVersion !== VERSION) showIfNeeded(remoteVersion);
      } catch {}
    }

    showIfNeeded(VERSION);
    checkLatestVersion();
    timer = window.setInterval(checkLatestVersion, CHECK_INTERVAL);
    const handleVisible = () => { if (document.visibilityState === "visible") checkLatestVersion(); };
    const handleFocus = () => checkLatestVersion();
    document.addEventListener("visibilitychange", handleVisible);
    window.addEventListener("focus", handleFocus);
    return () => {
      stopped = true;
      if (timer) window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisible);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  function applyUpdate() {
    try { localStorage.setItem(STORAGE_KEY, latestVersion); } catch {}
    const url = new URL(window.location.href);
    url.searchParams.set("_appv", latestVersion);
    url.searchParams.set("_refresh", String(Date.now()));
    window.location.replace(url.toString());
  }

  function later() { setOpen(false); }
  if (!open) return null;

  return (
    <div className="update-backdrop" role="dialog" aria-modal="true" aria-labelledby="update-title">
      <section className="update-card">
        <div className="update-badge">새 버전 v{latestVersion}</div>
        <h2 id="update-title">한끼장부가 업데이트되었습니다!</h2>
        <p className="update-lead">거래처 관리 화면에서 삭제와 복구 기능을 바로 사용할 수 있도록 개선했습니다.</p>
        <div className="update-items">
          <div><strong>거래처 삭제 버튼 표시</strong><span>각 거래처 오른쪽에서 수정과 삭제를 바로 선택할 수 있습니다.</span></div>
          <div><strong>안전한 삭제 방식</strong><span>삭제해도 기존 식수와 정산 기록은 지우지 않고 안전하게 보존합니다.</span></div>
          <div><strong>삭제 거래처 복구</strong><span>삭제된 거래처는 별도 목록에서 언제든 다시 복구할 수 있습니다.</span></div>
        </div>
        <button type="button" className="update-now" onClick={applyUpdate}>지금 업데이트</button>
        <button type="button" className="update-later" onClick={later}>나중에 하기</button>
        <small>키오스크 화면에는 업데이트 팝업이 표시되지 않습니다.</small>
      </section>
    </div>
  );
}
