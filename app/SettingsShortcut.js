"use client";

import {useEffect,useState} from "react";
import {createPortal} from "react-dom";

export default function SettingsShortcut(){
  const[target,setTarget]=useState(null);

  useEffect(()=>{
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

    return()=>{
      observer.disconnect();
      window.removeEventListener("popstate",findTarget);
    };
  },[]);

  if(!target)return null;

  return createPortal(
    <a className="btn secondary settings-toplink" href="/settings" aria-label="설정 열기">설정</a>,
    target
  );
}
