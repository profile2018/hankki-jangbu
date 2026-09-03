"use client";

import {useEffect,useState} from "react";
import {createPortal} from "react-dom";
import {createClient} from "../lib/supabase/client";

export default function MobileDashboardNav(){
  const[target,setTarget]=useState(null);
  const[restaurantName,setRestaurantName]=useState("식당 관리");
  const[isAdmin,setIsAdmin]=useState(false);

  useEffect(()=>{
    let active=true;
    const findTarget=()=>{
      const path=window.location.pathname.replace(/\/+$/,"")||"/";
      if(path!=="/dashboard"){setTarget(null);return;}
      const shell=document.querySelector(".dashboard-shell");
      if(shell){setTarget(shell);const name=shell.querySelector(".topbar span")?.textContent?.trim();if(name)setRestaurantName(name);}
    };
    findTarget();
    const observer=new MutationObserver(findTarget);
    observer.observe(document.body,{childList:true,subtree:true});
    (async()=>{try{const s=createClient();const{data,error}=await s.rpc("is_super_admin");if(active&&!error)setIsAdmin(Boolean(data));}catch{}})();
    return()=>{active=false;observer.disconnect();};
  },[]);

  async function logout(){const s=createClient();await s.auth.signOut();location.replace("/");}
  function goRestaurant(){const sections=[...document.querySelectorAll(".company-section")];const targetSection=sections[sections.length-1];targetSection?.scrollIntoView({behavior:"smooth",block:"start"});}
  function goAdmin(){
    window.location.assign("/admin");
  }

  if(!target)return null;
  return createPortal(
    <div className="mobile-dashboard-nav" aria-label="모바일 대시보드 메뉴">
      <div className="mobile-dashboard-title">
        <div><strong>한끼장부</strong><span>{isAdmin?"운영자 모드":"식당 관리"}</span></div>
        <button type="button" onClick={logout} className="mobile-logout">↪ <span>로그아웃</span></button>
      </div>
      <nav className={`mobile-menu-grid ${isAdmin?"has-admin":""}`}>
        <a href="/dashboard" className="mobile-menu-card home"><span className="mobile-menu-icon">⌂</span><b>한끼장부</b></a>
        <button type="button" onClick={goRestaurant} className="mobile-menu-card restaurant"><span className="mobile-menu-icon">🍚</span><b>{restaurantName}</b></button>
        {isAdmin&&<button type="button" onClick={goAdmin} className="mobile-menu-card admin"><span className="mobile-menu-icon">♙</span><b>최고관리자</b></button>}
        <a href="/settlement" className="mobile-menu-card settlement"><span className="mobile-menu-icon">▣</span><b>월별 정산</b></a>
        <a href="/settings" className="mobile-menu-card settings"><span className="mobile-menu-icon">⚙</span><b>설정</b></a>
      </nav>
    </div>,target
  );
}
