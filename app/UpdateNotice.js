"use client";

import { useEffect, useState } from "react";

const VERSION = "1.5.1";
const STORAGE_KEY = "hankki-jangbu-version";
const CHECK_INTERVAL = 5 * 60 * 1000;

export default function UpdateNotice() {
  const [open, setOpen] = useState(false);
  const [latestVersion, setLatestVersion] = useState(VERSION);

  useEffect(() => {
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
        if (!stopped && remoteVersion && remoteVersion !== VERSION) {
          showIfNeeded(remoteVersion);
        }
      } catch {}
    }

    showIfNeeded(VERSION);
    checkLatestVersion();
    timer = window.setInterval(checkLatestVersion, CHECK_INTERVAL);

    const handleVisible = () => {
      if (document.visibilityState === "visible") checkLatestVersion();
    };
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
        <p className="update-lead">이제 화면을 새로고침하지 않아도 새 버전을 자동으로 확인하고 업데이트 알림을 표시합니다.</p>
        <div className="update-items">
          <div><strong>자동 업데이트 확인</strong><span>앱을 계속 켜둔 상태에서도 약 5분마다 새 버전을 확인합니다.</span></div>
          <div><strong>화면 복귀 시 즉시 확인</strong><span>다른 창을 사용하다 한끼장부로 돌아오면 새 버전을 바로 확인합니다.</span></div>
          <div><strong>강제 새로고침 없음</strong><span>식수 입력 중 화면이 갑자기 바뀌지 않도록 사용자가 지금 업데이트를 누를 때만 적용합니다.</span></div>
        </div>
        <button type="button" className="update-now" onClick={applyUpdate}>지금 업데이트</button>
        <button type="button" className="update-later" onClick={later}>나중에 하기</button>
        <small>앞으로 새 버전이 배포되면 새로고침 없이 자동으로 알림을 받을 수 있습니다.</small>
      </section>
    </div>
  );
}
