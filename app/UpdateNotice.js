"use client";

import { useEffect, useState } from "react";

const VERSION = "1.5.8";
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

  return <div className="update-backdrop" role="dialog" aria-modal="true" aria-labelledby="update-title"><section className="update-card"><div className="update-badge">새 버전 v{latestVersion}</div><h2 id="update-title">한끼장부가 업데이트되었습니다!</h2><p className="update-lead">첫 화면에서 한끼장부 전단지를 바로 확인할 수 있습니다.</p><div className="update-items"><div><strong>전단지 보기 메뉴</strong><span>사용방법·장점·요금제 옆에 전단지 보기 메뉴를 추가했습니다.</span></div><div><strong>큰 화면으로 확인</strong><span>전단지를 팝업으로 크게 보고 새 창에서 더 크게 열 수도 있습니다.</span></div><div><strong>최신 안내 반영</strong><span>문의전화 010-4696-5037, 카카오톡 bwk2000, 웹사이트 hankkijangbu.kr 안내를 반영했습니다.</span></div></div><button type="button" className="update-now" onClick={applyUpdate}>지금 업데이트</button><button type="button" className="update-later" onClick={later}>나중에 하기</button><small>키오스크 화면에는 업데이트 팝업이 표시되지 않습니다.</small></section></div>;
}
