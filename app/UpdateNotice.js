"use client";

import { useEffect, useState } from "react";

const VERSION = "1.6.0";
const STORAGE_KEY = "hankki-jangbu-version";
const CHECK_INTERVAL = 5 * 60 * 1000;

export default function UpdateNotice() {
  const [open, setOpen] = useState(false);
  const [latestVersion, setLatestVersion] = useState(VERSION);

  useEffect(() => {
    if (window.location.pathname.startsWith("/kiosk")) { setOpen(false); return; }
    let timer; let stopped = false;
    function showIfNeeded(version) { try { const applied=localStorage.getItem(STORAGE_KEY); if(applied!==version){setLatestVersion(version);setOpen(true);} } catch {setLatestVersion(version);setOpen(true);} }
    async function checkLatestVersion(){try{const response=await fetch(`/app-version.json?_=${Date.now()}`,{cache:"no-store",headers:{"cache-control":"no-cache"}});if(!response.ok)return;const data=await response.json();const remoteVersion=String(data?.version||"").trim();if(!stopped&&remoteVersion&&remoteVersion!==VERSION)showIfNeeded(remoteVersion);}catch{}}
    showIfNeeded(VERSION);checkLatestVersion();timer=window.setInterval(checkLatestVersion,CHECK_INTERVAL);
    const handleVisible=()=>{if(document.visibilityState==="visible")checkLatestVersion();};const handleFocus=()=>checkLatestVersion();document.addEventListener("visibilitychange",handleVisible);window.addEventListener("focus",handleFocus);
    return()=>{stopped=true;if(timer)window.clearInterval(timer);document.removeEventListener("visibilitychange",handleVisible);window.removeEventListener("focus",handleFocus);};
  }, []);

  function applyUpdate(){try{localStorage.setItem(STORAGE_KEY,latestVersion);}catch{}const url=new URL(window.location.href);url.searchParams.set("_appv",latestVersion);url.searchParams.set("_refresh",String(Date.now()));window.location.replace(url.toString());}
  function later(){setOpen(false);} if(!open)return null;

  return <div className="update-backdrop" role="dialog" aria-modal="true" aria-labelledby="update-title"><section className="update-card"><div className="update-badge">새 버전 v{latestVersion}</div><h2 id="update-title">한끼장부가 업데이트되었습니다!</h2><p className="update-lead">스마트폰의 최고관리자 메뉴를 일반 메뉴와 분리해 더 확실하게 이동하도록 개선했습니다.</p><div className="update-items"><div><strong>최고관리자 전용 버튼</strong><span>최고관리자를 별도 큰 버튼으로 분리해 다른 메뉴와 잘못 눌리는 문제를 줄였습니다.</span></div><div><strong>강제 새 화면 이동</strong><span>최고관리자 버튼은 캐시 우회를 포함한 /admin 링크로 직접 이동합니다.</span></div><div><strong>메뉴 오동작 정리</strong><span>식당 메뉴가 잘못 아래 추가기능 영역으로 이동하던 동작도 함께 바로잡았습니다.</span></div></div><button type="button" className="update-now" onClick={applyUpdate}>지금 업데이트</button><button type="button" className="update-later" onClick={later}>나중에 하기</button><small>키오스크 화면에는 업데이트 팝업이 표시되지 않습니다.</small></section></div>;
}
