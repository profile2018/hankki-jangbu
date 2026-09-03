"use client";

import { useEffect, useState } from "react";

const VERSION = "1.5.9";
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

  return <div className="update-backdrop" role="dialog" aria-modal="true" aria-labelledby="update-title"><section className="update-card"><div className="update-badge">새 버전 v{latestVersion}</div><h2 id="update-title">한끼장부가 업데이트되었습니다!</h2><p className="update-lead">스마트폰에서 최고관리자 메뉴가 정확한 운영자 화면으로 이동하도록 수정했습니다.</p><div className="update-items"><div><strong>최고관리자 이동 수정</strong><span>모바일 최고관리자 버튼을 누르면 /admin 서비스 관리 화면으로 직접 이동합니다.</span></div><div><strong>메뉴 명칭 정리</strong><span>모바일에서 운영자 관리 메뉴를 최고관리자로 표시해 구분을 더 명확하게 했습니다.</span></div><div><strong>키오스크 영향 없음</strong><span>키오스크 화면과 식수 입력 기능은 변경하지 않았습니다.</span></div></div><button type="button" className="update-now" onClick={applyUpdate}>지금 업데이트</button><button type="button" className="update-later" onClick={later}>나중에 하기</button><small>키오스크 화면에는 업데이트 팝업이 표시되지 않습니다.</small></section></div>;
}
