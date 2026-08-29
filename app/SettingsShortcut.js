"use client";

import {useEffect,useState} from "react";

export default function SettingsShortcut(){
  const[show,setShow]=useState(false);
  useEffect(()=>{
    const update=()=>setShow(window.location.pathname==="/dashboard");
    update();
    window.addEventListener("popstate",update);
    return()=>window.removeEventListener("popstate",update);
  },[]);
  if(!show)return null;
  return <a className="settings-shortcut" href="/settings" aria-label="설정 열기">⚙️ 설정</a>;
}
