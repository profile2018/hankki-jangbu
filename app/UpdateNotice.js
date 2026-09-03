"use client";

import { useEffect, useState } from "react";

const VERSION = "1.5.5";
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

  return <div className="update-backdrop" role="dialog" aria-modal="true" aria-labelledby="update-title"><section className="update-card"><div className="update-badge">새 버전 v{latestVersion}</div><h2 id="update-title">한끼장부가 업데이트되었습니다!</h2><p className="update-lead">문자 인증 서비스 없이 휴대폰번호를 로그인 아이디처럼 사용할 수 있도록 가입 방식을 변경했습니다.</p><div className="update-items"><div><strong>문자 인증 불필요</strong><span>Twilio나 SMS 인증 없이 휴대폰번호와 비밀번호만으로 가입할 수 있습니다.</span></div><div><strong>기존 회원 유지</strong><span>기존 이메일 계정은 그대로 이메일과 비밀번호로 로그인할 수 있습니다.</span></div><div><strong>휴대폰번호 간편 로그인</strong><span>신규 회원은 화면에서 휴대폰번호만 입력하면 내부 인증 계정으로 자동 처리됩니다.</span></div></div><button type="button" className="update-now" onClick={applyUpdate}>지금 업데이트</button><button type="button" className="update-later" onClick={later}>나중에 하기</button><small>키오스크 화면에는 업데이트 팝업이 표시되지 않습니다.</small></section></div>;
}
