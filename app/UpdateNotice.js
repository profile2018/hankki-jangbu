"use client";

import { useEffect, useState } from "react";

const VERSION = "1.6.6";
const STORAGE_KEY = "hankki-jangbu-version";
const CHECK_INTERVAL = 5 * 60 * 1000;

export default function UpdateNotice() {
  const [open,setOpen]=useState(false); const [latestVersion,setLatestVersion]=useState(VERSION);
  useEffect(()=>{if(window.location.pathname.startsWith("/kiosk")){setOpen(false);return;}let timer;let stopped=false;function showIfNeeded(version){try{const applied=localStorage.getItem(STORAGE_KEY);if(applied!==version){setLatestVersion(version);setOpen(true);}}catch{setLatestVersion(version);setOpen(true);}}async function checkLatestVersion(){try{const response=await fetch(`/app-version.json?_=${Date.now()}`,{cache:"no-store",headers:{"cache-control":"no-cache"}});if(!response.ok)return;const data=await response.json();const remoteVersion=String(data?.version||"").trim();if(!stopped&&remoteVersion&&remoteVersion!==VERSION)showIfNeeded(remoteVersion);}catch{}}showIfNeeded(VERSION);checkLatestVersion();timer=window.setInterval(checkLatestVersion,CHECK_INTERVAL);const handleVisible=()=>{if(document.visibilityState==="visible")checkLatestVersion();};const handleFocus=()=>checkLatestVersion();document.addEventListener("visibilitychange",handleVisible);window.addEventListener("focus",handleFocus);return()=>{stopped=true;if(timer)window.clearInterval(timer);document.removeEventListener("visibilitychange",handleVisible);window.removeEventListener("focus",handleFocus);};},[]);
  function applyUpdate(){try{localStorage.setItem(STORAGE_KEY,latestVersion);}catch{}const url=new URL(window.location.href);url.searchParams.set("_appv",latestVersion);url.searchParams.set("_refresh",String(Date.now()));window.location.replace(url.toString());} function later(){setOpen(false);} if(!open)return null;
  return <div className="update-backdrop" role="dialog" aria-modal="true" aria-labelledby="update-title"><section className="update-card"><div className="update-badge">새 버전 v{latestVersion}</div><h2 id="update-title">한끼장부가 업데이트되었습니다!</h2><p className="update-lead">한끼장부에 따뜻하고 생동감 있는 식당 분위기의 색상을 적용했습니다.</p><div className="update-items"><div><strong>새로운 식당 컬러</strong><span>바닐라 크림·토마토 레드·오렌지·허브 그린을 PC와 모바일에 적용했습니다.</span></div><div><strong>기존 기능 유지</strong><span>식수 등록과 정산 기능은 그대로 유지됩니다.</span></div></div><button type="button" className="update-now" onClick={applyUpdate}>지금 업데이트</button><button type="button" className="update-later" onClick={later}>나중에 하기</button><small>키오스크 화면에는 업데이트 팝업이 표시되지 않습니다.</small></section></div>;
}
