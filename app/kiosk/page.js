"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "../../lib/supabase/client";

function KioskClock() {
  const [now, setNow] = useState(null);
  useEffect(() => { setNow(new Date()); const timer=setInterval(()=>setNow(new Date()),1000); return()=>clearInterval(timer); },[]);
  if(!now) return <div className="kiosk-clock"><strong>날짜 · 시간</strong></div>;
  const date=new Intl.DateTimeFormat("ko-KR",{year:"numeric",month:"long",day:"numeric",weekday:"long"}).format(now);
  const time=new Intl.DateTimeFormat("ko-KR",{hour:"numeric",minute:"2-digit",hour12:true}).format(now);
  return <div className="kiosk-clock"><span>{date}</span><strong>{time}</strong></div>;
}

export default function KioskPage(){
 const [restaurantId,setRestaurantId]=useState(""); const [pin,setPin]=useState(""); const [company,setCompany]=useState(null); const [mealType,setMealType]=useState("lunch"); const [headcount,setHeadcount]=useState(1); const [headcountBuffer,setHeadcountBuffer]=useState(""); const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false); const [done,setDone]=useState(false); const [adminOpen,setAdminOpen]=useState(false); const [adminMessage,setAdminMessage]=useState("");
 useEffect(()=>{const params=new URLSearchParams(window.location.search);setRestaurantId(params.get("r")||"");},[]);
 const [keepScreenOn,setKeepScreenOn]=useState(true);
 const [wakeStatus,setWakeStatus]=useState("checking");
 const wakeLockRef=useRef(null);
 const keepScreenOnRef=useRef(true);
 useEffect(()=>{try{const saved=localStorage.getItem("hankki-kiosk-keep-screen-on");const enabled=saved!=="false";keepScreenOnRef.current=enabled;setKeepScreenOn(enabled);}catch{}},[]);
 useEffect(()=>{
   let disposed=false;
   async function releaseWakeLock(){const lock=wakeLockRef.current;wakeLockRef.current=null;if(lock){try{await lock.release();}catch{}}}
   async function requestWakeLock(){
     if(disposed||!keepScreenOn||document.visibilityState!=="visible")return;
     if(!("wakeLock" in navigator)||typeof navigator.wakeLock?.request!=="function"){setWakeStatus("unsupported");return;}
     if(wakeLockRef.current&&!wakeLockRef.current.released){setWakeStatus("active");return;}
     try{
       const lock=await navigator.wakeLock.request("screen");
       if(disposed||!keepScreenOnRef.current){try{await lock.release();}catch{}return;}
       wakeLockRef.current=lock;setWakeStatus("active");
       lock.addEventListener("release",()=>{if(wakeLockRef.current===lock){wakeLockRef.current=null;setWakeStatus("inactive");}});
     }catch{if(!disposed)setWakeStatus("blocked");}
   }
   if(keepScreenOn){setWakeStatus("checking");requestWakeLock();}
   else{setWakeStatus("off");releaseWakeLock();}
   const onVisible=()=>{if(document.visibilityState==="visible")requestWakeLock();else setWakeStatus("inactive");};
   document.addEventListener("visibilitychange",onVisible);
   window.addEventListener("focus",requestWakeLock);
   return()=>{disposed=true;document.removeEventListener("visibilitychange",onVisible);window.removeEventListener("focus",requestWakeLock);releaseWakeLock();};
 },[keepScreenOn]);
 function changeKeepScreenOn(enabled){keepScreenOnRef.current=enabled;setKeepScreenOn(enabled);try{localStorage.setItem("hankki-kiosk-keep-screen-on",String(enabled));}catch{}}
 const wakeStatusText=!keepScreenOn?"화면 유지 꺼짐":wakeStatus==="active"?"화면 유지 작동 중":wakeStatus==="unsupported"?"이 브라우저에서는 지원하지 않습니다":wakeStatus==="blocked"?"화면 유지 요청 실패 · 태블릿 설정을 확인하세요":wakeStatus==="inactive"?"대기 중 · 화면 복귀 시 재요청":"화면 유지 연결 중";

 async function identify(e){e?.preventDefault();setMessage("");if(!restaurantId)return setMessage("식당 연결 정보가 없습니다. 사장님께 문의해 주세요.");if(!/^\d{4}$/.test(pin))return setMessage("업체번호 4자리를 입력해 주세요.");setBusy(true);const s=createClient();const{data,error}=await s.rpc("kiosk_identify_company",{p_restaurant_id:restaurantId,p_pin:pin});const row=Array.isArray(data)?data[0]:data;if(error||!row){setCompany(null);setPin("");setMessage("등록된 업체를 찾을 수 없습니다. 업체번호를 다시 확인해 주세요.");}else{setCompany(row);setMealType("lunch");setHeadcount(1);setHeadcountBuffer("");}setBusy(false);}
 function pressPinNumber(n){if(busy)return;setMessage("");setPin(c=>c.length>=4?c:`${c}${n}`)} function backspacePin(){if(!busy)setPin(c=>c.slice(0,-1))} function clearPin(){if(!busy)setPin("")}
 function pressHeadcountNumber(n){if(busy)return;setMessage("");setHeadcountBuffer(prev=>{const next=(prev+String(n)).slice(0,3);const value=Math.min(999,Number(next||0));setHeadcount(value);return next;});}
 function clearHeadcount(){if(busy)return;setHeadcountBuffer("");setHeadcount(1);}
 function backspaceHeadcount(){if(busy)return;setHeadcountBuffer(prev=>{const next=prev.slice(0,-1);setHeadcount(next?Number(next):1);return next;});}
 function adjustHeadcount(delta){if(busy)return;const next=Math.min(999,Math.max(1,Number(headcount||1)+delta));setHeadcount(next);setHeadcountBuffer(String(next));}
 async function submitMeal(){setMessage("");if(!company)return;if(headcount<1||headcount>999)return setMessage("인원수를 확인해 주세요.");setBusy(true);const s=createClient();const{data,error}=await s.rpc("kiosk_record_meal",{p_restaurant_id:restaurantId,p_pin:pin,p_meal_type:mealType,p_headcount:headcount});if(error||!data)setMessage(error?.message||"식수 등록 중 오류가 발생했습니다.");else{setDone(true);setTimeout(()=>reset(),2200)}setBusy(false)}
 function reset(){setPin("");setCompany(null);setMealType("lunch");setHeadcount(1);setHeadcountBuffer("");setMessage("");setDone(false)}
 function openAdmin(){setAdminMessage("");setAdminOpen(true)}
 async function goAdmin(){setAdminMessage("");const s=createClient();const{data:{session}}=await s.auth.getSession();if(session){window.location.href="/dashboard";return;}setAdminMessage("관리자 로그인이 필요합니다. 로그인 화면으로 이동합니다.");setTimeout(()=>{window.location.href="/login"},700)}
 const adminModal=adminOpen?<div className="kiosk-admin-backdrop" onClick={()=>setAdminOpen(false)}><div className="kiosk-admin-modal" onClick={e=>e.stopPropagation()}><div className="admin-lock">🔒</div><h2>관리자 전용</h2><p>키오스크를 종료하고 관리 화면으로 이동하시겠습니까?</p><div className="kiosk-display-setting"><label htmlFor="kiosk-keep-screen-on"><span><strong>화면 항상 켜짐</strong><small>키오스크 이용 중 자동 화면 꺼짐 방지</small></span><input id="kiosk-keep-screen-on" type="checkbox" checked={keepScreenOn} onChange={e=>changeKeepScreenOn(e.target.checked)}/></label><p role="status">{wakeStatusText}</p><small>브라우저와 태블릿 절전 설정에 따라 화면 유지가 해제될 수 있습니다. 충전 중 화면 켜짐 유지 설정도 권장합니다.</small></div><button className="btn primary" onClick={goAdmin}>관리자 인증 후 홈으로</button><button className="btn secondary" onClick={()=>setAdminOpen(false)}>취소</button>{adminMessage&&<span>{adminMessage}</span>}</div></div>:null;
 if(done)return <main className={`kiosk-shell done-${mealType}`}><section className="kiosk-card kiosk-done"><KioskClock/><div className="done-mark">✓</div><h1>등록되었습니다</h1><p>{company?.company_name} · {mealType==="lunch"?"중식":"석식"} {headcount}명</p><strong className="meal-wish">맛있는 식사하세요.</strong><span>잠시 후 업체번호 입력 화면으로 돌아갑니다.</span></section></main>;
 return <main className={`kiosk-shell ${company?"kiosk-company-mode":""}`}>
 {company&&<aside className="kiosk-reselect-panel"><button type="button" className="kiosk-company-back" onClick={reset}>← 업체 다시 선택</button><p>다른 업체라면 이 버튼을 눌러 업체번호 입력 화면으로 돌아가세요.</p></aside>}
 <section className="kiosk-card"><header className="kiosk-head"><div className="kiosk-brand-wrap"><button type="button" className="kiosk-brand-button" onClick={openAdmin} aria-label="관리자 메뉴 열기"><div className="mini-brand">한끼</div></button><div><strong>한끼장부</strong><span>식수 입력</span></div></div><div className="kiosk-head-right"><KioskClock/><button type="button" className="kiosk-admin-button" onClick={openAdmin}>관리자</button></div></header>
 {!company?<><div className="kiosk-title kiosk-pin-title"><h1>업체번호를 입력하세요.</h1></div><div className="kiosk-pin-display">{[0,1,2,3].map(i=><span key={i} className={pin.length>i?"filled":""}>{pin.length>i?"●":""}</span>)}</div><div className="kiosk-keypad">{[1,2,3,4,5,6,7,8,9].map(n=><button type="button" key={n} onClick={()=>pressPinNumber(n)} disabled={busy}>{n}</button>)}<button className="keypad-action" onClick={clearPin}>전체지움</button><button onClick={()=>pressPinNumber(0)}>0</button><button className="keypad-action" onClick={backspacePin}>⌫</button></div><button className="btn primary kiosk-pin-confirm" onClick={identify} disabled={busy||pin.length!==4}>{busy?"확인 중...":"업체 확인"}</button></>:<><div className="company-confirm"><span>확인된 업체</span><h1>{company.company_name}</h1><button onClick={reset}>다시 입력</button></div><div className="meal-buttons"><button className={`lunch ${mealType==="lunch"?"active":""}`} onClick={()=>setMealType("lunch")}><span>중식</span><strong>{Number(company.lunch_price).toLocaleString()}원</strong></button><button className={`dinner ${mealType==="dinner"?"active":""}`} onClick={()=>setMealType("dinner")}><span>석식</span><strong>{Number(company.dinner_price).toLocaleString()}원</strong></button></div><div className="kiosk-entry-layout"><div className="headcount-keypad-panel"><span className="headcount-label">인원수 입력</span><div className="headcount-keypad">{[1,2,3,4,5,6,7,8,9].map(n=><button key={n} type="button" onClick={()=>pressHeadcountNumber(n)} disabled={busy}>{n}</button>)}<button type="button" className="keypad-action" onClick={clearHeadcount}>전체지움</button><button type="button" onClick={()=>pressHeadcountNumber(0)}>0</button><button type="button" className="keypad-action" onClick={backspaceHeadcount}>⌫</button></div><div className="headcount-current"><span>현재 인원</span><strong>{headcount}명</strong><div><button type="button" onClick={()=>adjustHeadcount(-1)}>−</button><button type="button" onClick={()=>adjustHeadcount(1)}>＋</button></div></div></div><button className={`btn kiosk-submit kiosk-submit-large ${mealType==="lunch"?"lunch-submit":"dinner-submit"}`} onClick={submitMeal} disabled={busy}><span className="submit-check">✓</span><strong>{busy?"등록 중...":`${mealType==="lunch"?"중식":"석식"} ${headcount}명 등록하기`}</strong><small>입력한 인원을 등록합니다.</small></button></div></>}{message&&<p className="error kiosk-message">{message}</p>}</section>{adminModal}</main>;
}
