"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
export default function BillingResult(){
 const [result,setResult]=useState("카드 등록 결과를 확인하는 중입니다...");
 useEffect(()=>{let cancelled=false;(async()=>{const q=new URLSearchParams(location.search);const error=q.get("message");if(q.get("code")){setResult("카드 등록이 취소되거나 실패했습니다. "+(error||""));return;}const authKey=q.get("authKey"),customerKey=q.get("customerKey"),state=sessionStorage.getItem("hankki-billing-state");sessionStorage.removeItem("hankki-billing-state");if(!authKey||!customerKey||!state){setResult("인증 정보가 없습니다. 구독 관리에서 다시 시도해 주세요.");return;}try{const r=await fetch("/api/billing/complete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({authKey,customerKey,state})});const data=await r.json();if(!cancelled)setResult(data.message||data.error||"등록 결과를 확인할 수 없습니다.");}catch{if(!cancelled)setResult("카드 등록 결과를 확인하지 못했습니다.");}})();return()=>{cancelled=true};},[]);
 return <main className="subscription-shell"><h1>테스트 카드 등록 결과</h1><p role="status">{result}</p><Link href="/subscription">← 구독 관리로 돌아가기</Link></main>;
}