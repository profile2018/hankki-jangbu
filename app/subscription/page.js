"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {createClient} from "../../lib/supabase/client";

const PLANS=[{id:"basic",name:"베이직",price:29000,description:"식수 기록 및 월별 정산"},{id:"plus",name:"플러스",price:49000,description:"확장 기능을 위한 요금제"}];
export default function SubscriptionPage(){
 const [keyStatus,setKeyStatus]=useState(null);const [billingBusy,setBillingBusy]=useState(false);const [billingMessage,setBillingMessage]=useState("");const [loading,setLoading]=useState(true),[restaurant,setRestaurant]=useState(null),[plan,setPlan]=useState("basic"),[error,setError]=useState("");
 useEffect(()=>{let active=true;(async()=>{try{const s=createClient();const{data:{user},error:authError}=await s.auth.getUser();if(authError||!user){location.replace("/login");return;}const{data:member,error:memberError}=await s.from("restaurant_members").select("restaurant_id").eq("user_id",user.id).limit(1).maybeSingle();if(memberError)throw memberError;if(!member?.restaurant_id){location.replace("/onboarding");return;}const{data:row,error:restaurantError}=await s.from("restaurants").select("id,name,trial_ends_at").eq("id",member.restaurant_id).single();if(restaurantError)throw restaurantError;if(active)setRestaurant(row);}catch(e){if(active)setError("구독 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");}finally{if(active)setLoading(false);}})();return()=>{active=false};},[]);
 async function checkKeys(){setKeyStatus({message:"서버 설정 확인 중..."});try{const response=await fetch("/api/billing/readiness",{cache:"no-store"});const data=await response.json();setKeyStatus(data);}catch{setKeyStatus({ready:false,message:"서버 설정을 확인할 수 없습니다."});}}
 async function registerTestCard(){
  setBillingBusy(true);setBillingMessage("");
  try{
   const res=await fetch("/api/billing/start",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({plan})});
   const data=await res.json();
   if(!res.ok)throw Error(data.error||"카드 등록을 시작할 수 없습니다.");
   if(!window.TossPayments){
    await new Promise((resolve,reject)=>{const script=document.createElement("script");script.src="https://js.tosspayments.com/v2/standard";script.onload=resolve;script.onerror=()=>reject(Error("결제창 SDK를 불러올 수 없습니다."));document.head.appendChild(script);});
   }
   sessionStorage.setItem("hankki-billing-state",data.state);
   const toss=window.TossPayments(data.clientKey);
   const payment=toss.payment({customerKey:data.customerKey});
   await payment.requestBillingAuth({method:"CARD",successUrl:location.origin+"/subscription/billing-result",failUrl:location.origin+"/subscription/billing-result",customerEmail:"",customerName:restaurant?.name||"한끼장부 고객"});
  }catch(e){setBillingMessage(e.message||"카드 등록창을 열 수 없습니다.");setBillingBusy(false);}
 }
 const selected=PLANS.find(p=>p.id===plan);
 const end=restaurant?.trial_ends_at?new Date(restaurant.trial_ends_at):null;
 const days=end?Math.max(0,Math.ceil((end.getTime()-Date.now())/86400000)):null;
 return <main className="subscription-shell"><div className="subscription-top"><Link href="/dashboard">← 대시보드</Link><span>한끼장부 · 구독 관리</span></div><header><span className="subscription-eyebrow">LUMICODE · 한끼장부</span><h1>구독 관리</h1><p>30일 무료체험 후 필요한 요금제를 선택해 이용하세요.</p></header>
 {loading?<p>구독 정보를 확인하는 중입니다...</p>:error?<p role="alert">{error}</p>:<><section className="subscription-trial"><div><small>현재 이용 중인 식당</small><strong>{restaurant?.name}</strong></div><div><small>무료체험</small><strong>{days===null?"기간 확인 필요":days>0?`${days}일 남음`:"종료일 경과"}</strong>{end&&<span>종료일: {end.toLocaleDateString("ko-KR")}</span>}</div></section><h2>월 구독 요금제</h2><div className="subscription-plans">{PLANS.map(p=><button key={p.id} type="button" aria-pressed={plan===p.id} className={plan===p.id?"selected":""} onClick={()=>setPlan(p.id)}><strong>{p.name}</strong><span>{p.description}</span><b>{p.price.toLocaleString("ko-KR")}원 <small>/ 월</small></b></button>)}</div><section className="subscription-summary"><h2>선택한 요금제</h2><div><span>{selected.name} 월 이용료</span><strong>{selected.price.toLocaleString("ko-KR")}원</strong></div><p>실제 결제 전에는 부가세 포함 여부, 자동결제일, 취소·환불 조건을 안내하고 동의를 받습니다.</p><button type="button" className="subscription-check-keys" onClick={registerTestCard} disabled={billingBusy}>{billingBusy?"테스트 카드 등록창 준비 중...":"테스트 카드 등록하기"}</button>{billingMessage&&<p role="alert">{billingMessage}</p>}<button type="button" className="subscription-check-keys" onClick={checkKeys}>토스페이먼츠 테스트 키 연결 확인</button>{keyStatus&&<p role="status">{keyStatus.ready?"✓ ":"⚠ "}{keyStatus.message}</p>}<small>테스트 전용 카드 등록입니다. 데이터베이스 및 보안 저장 설정이 준비되어야 작동합니다. 실제 결제 및 자동결제는 실행되지 않습니다.</small></section></>}
 <footer>서비스 브랜드: 한끼장부 · 운영 예정 상호: 루미코드</footer></main>;
}
