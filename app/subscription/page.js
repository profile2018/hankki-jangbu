"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {createClient} from "../../lib/supabase/client";

const PLANS=[{id:"basic",name:"베이직",price:29000,description:"식수 기록 및 월별 정산"},{id:"plus",name:"플러스",price:49000,description:"확장 기능을 위한 요금제"}];
export default function SubscriptionPage(){
 const [loading,setLoading]=useState(true),[restaurant,setRestaurant]=useState(null),[plan,setPlan]=useState("basic"),[error,setError]=useState("");
 useEffect(()=>{let active=true;(async()=>{try{const s=createClient();const{data:{user},error:authError}=await s.auth.getUser();if(authError||!user){location.replace("/login");return;}const{data:member,error:memberError}=await s.from("restaurant_members").select("restaurant_id").eq("user_id",user.id).limit(1).maybeSingle();if(memberError)throw memberError;if(!member?.restaurant_id){location.replace("/onboarding");return;}const{data:row,error:restaurantError}=await s.from("restaurants").select("id,name,trial_ends_at").eq("id",member.restaurant_id).single();if(restaurantError)throw restaurantError;if(active)setRestaurant(row);}catch(e){if(active)setError("구독 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");}finally{if(active)setLoading(false);}})();return()=>{active=false};},[]);
 const selected=PLANS.find(p=>p.id===plan);
 const end=restaurant?.trial_ends_at?new Date(restaurant.trial_ends_at):null;
 const days=end?Math.max(0,Math.ceil((end.getTime()-Date.now())/86400000)):null;
 return <main className="subscription-shell"><div className="subscription-top"><Link href="/dashboard">← 대시보드</Link><span>한끼장부 · 구독 관리</span></div><header><span className="subscription-eyebrow">LUMICODE · 한끼장부</span><h1>구독 관리</h1><p>30일 무료체험 후 필요한 요금제를 선택해 이용하세요.</p></header>
 {loading?<p>구독 정보를 확인하는 중입니다...</p>:error?<p role="alert">{error}</p>:<><section className="subscription-trial"><div><small>현재 이용 중인 식당</small><strong>{restaurant?.name}</strong></div><div><small>무료체험</small><strong>{days===null?"기간 확인 필요":days>0?`${days}일 남음`:"종료일 경과"}</strong>{end&&<span>종료일: {end.toLocaleDateString("ko-KR")}</span>}</div></section><h2>월 구독 요금제</h2><div className="subscription-plans">{PLANS.map(p=><button key={p.id} type="button" aria-pressed={plan===p.id} className={plan===p.id?"selected":""} onClick={()=>setPlan(p.id)}><strong>{p.name}</strong><span>{p.description}</span><b>{p.price.toLocaleString("ko-KR")}원 <small>/ 월</small></b></button>)}</div><section className="subscription-summary"><h2>선택한 요금제</h2><div><span>{selected.name} 월 이용료</span><strong>{selected.price.toLocaleString("ko-KR")}원</strong></div><p>실제 결제 전에는 부가세 포함 여부, 자동결제일, 취소·환불 조건을 안내하고 동의를 받습니다.</p><button type="button" disabled>카드 등록 및 정기결제 준비 중</button><small>토스페이먼츠 정기결제 계약과 API 키 연결 후 카드 등록이 활성화됩니다. 현재는 카드정보를 수집하거나 결제하지 않습니다.</small></section></>}
 <footer>서비스 브랜드: 한끼장부 · 운영 예정 상호: 루미코드</footer></main>;
}
