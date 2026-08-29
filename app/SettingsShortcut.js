"use client";

import {useEffect,useState} from "react";
import {createPortal} from "react-dom";
import {createClient} from "../lib/supabase/client";

export default function SettingsShortcut(){
  const[target,setTarget]=useState(null);
  const[isAdmin,setIsAdmin]=useState(false);

  useEffect(()=>{
    let active=true;
    const findTarget=()=>{
      const path=window.location.pathname.replace(/\/+$/,"")||"/";
      if(path!=="/dashboard"){
        setTarget(null);
        return;
      }
      const el=document.querySelector(".topbar-actions");
      if(el)setTarget(el);
    };

    findTarget();
    const observer=new MutationObserver(findTarget);
    observer.observe(document.body,{childList:true,subtree:true});
    window.addEventListener("popstate",findTarget);

    (async()=>{
      try{
        const s=createClient();
        const{data,error}=await s.rpc("is_super_admin");
        if(active&&!error)setIsAdmin(Boolean(data));
      }catch{}
    })();

    return()=>{
      active=false;
      observer.disconnect();
      window.removeEventListener("popstate",findTarget);
    };
  },[]);

  if(!target)return null;

  return createPortal(
    <>
      <a className="btn secondary settings-toplink" href="/settings" aria-label="설정 열기">설정</a>
      {isAdmin&&<a className="btn secondary admin-toplink" href="/admin" aria-label="운영자 관리 열기">운영자 관리</a>}
    </>,
    target
  );
}
