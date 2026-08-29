"use client";

import {useEffect,useState} from "react";
import {createPortal} from "react-dom";

export default function SettingsShortcut(){
  const[target,setTarget]=useState(null);

  useEffect(()=>{
    const update=()=>{
      const path=window.location.pathname.replace(/\/+$/,"")||"/";
      if(path!=="/dashboard"){
        setTarget(null);
        return;
      }
      setTarget(document.querySelector(".topbar-actions"));
    };

    update();
    const timer=setTimeout(update,50);
    window.addEventListener("popstate",update);
    return()=>{
      clearTimeout(timer);
      window.removeEventListener("popstate",update);
    };
  },[]);

  if(!target)return null;

  return createPortal(
    <a className="btn secondary settings-toplink" href="/settings" aria-label="설정 열기">설정</a>,
    target
  );
}
