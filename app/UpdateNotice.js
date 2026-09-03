"use client";

import { useEffect, useState } from "react";

const VERSION = "1.5.7";
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

  return <div className="update-backdrop" role="dialog" aria-modal="true" aria-labelledby="update-title"><section className="update-card"><div className="update-badge">새 버전 v{latestVersion}</div><h2 id="update-title">한끼장부가 업데이트되었습니다!</h2><p className="update-lead">첫 화면 안내를 더 깔끔하게 정리했습니다.</p><div className="update-items"><div><strong>메뉴형 안내</strong><span>사용방법·장점·요금제 내용은 처음부터 펼쳐지지 않고 메뉴를 눌렀을 때만 표시됩니다.</span></div><div><strong>한 번에 하나만 표시</strong><span>다른 메뉴를 누르면 선택한 안내만 보여주어 화면이 길어지지 않습니다.</span></div><div><strong>다시 누르면 닫기</strong><span>현재 선택한 메뉴를 한 번 더 누르면 안내 영역을 접을 수 있습니다.</span></div></div><button type="button" className="update-now" onClick={applyUpdate}>지금 업데이트</button><button type="button" className="update-later" onClick={later}>나중에 하기</button><small>키오스크 화면에는 업데이트 팝업이 표시되지 않습니다.</small></section></div>;
}
