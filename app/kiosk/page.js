"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

function KioskClock() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  if (!now) return <div className="kiosk-clock" aria-label="현재 날짜와 시간"><strong>날짜 · 시간</strong></div>;
  const date = new Intl.DateTimeFormat("ko-KR", { year:"numeric", month:"long", day:"numeric", weekday:"long" }).format(now);
  const time = new Intl.DateTimeFormat("ko-KR", { hour:"numeric", minute:"2-digit", hour12:true }).format(now);
  return <div className="kiosk-clock" aria-label={`현재 ${date} ${time}`}><span>{date}</span><strong>{time}</strong></div>;
}

export default function KioskPage() {
  const [restaurantId, setRestaurantId] = useState("");
  const [pin, setPin] = useState("");
  const [company, setCompany] = useState(null);
  const [mealType, setMealType] = useState("lunch");
  const [headcount, setHeadcount] = useState(1);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRestaurantId(params.get("r") || "");
  }, []);

  async function identify(e) {
    e?.preventDefault(); setMessage("");
    if (!restaurantId) return setMessage("식당 연결 정보가 없습니다. 사장님께 문의해 주세요.");
    if (!/^\d{4}$/.test(pin)) return setMessage("업체 PIN 4자리를 입력해 주세요.");
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("kiosk_identify_company", { p_restaurant_id: restaurantId, p_pin: pin });
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row) { setCompany(null); setPin(""); setMessage("등록된 업체를 찾을 수 없습니다. PIN을 다시 확인해 주세요."); }
    else { setCompany(row); setMealType("lunch"); setHeadcount(1); }
    setBusy(false);
  }

  function pressPinNumber(number) { if (busy) return; setMessage(""); setPin((current) => current.length >= 4 ? current : `${current}${number}`); }
  function backspacePin() { if (busy) return; setMessage(""); setPin((current) => current.slice(0, -1)); }
  function clearPin() { if (busy) return; setMessage(""); setPin(""); }

  async function submitMeal() {
    setMessage(""); if (!company) return;
    if (headcount < 1 || headcount > 999) return setMessage("인원수를 확인해 주세요.");
    setBusy(true); const supabase = createClient();
    const { data, error } = await supabase.rpc("kiosk_record_meal", { p_restaurant_id: restaurantId, p_pin: pin, p_meal_type: mealType, p_headcount: headcount });
    if (error || !data) setMessage(error?.message || "식수 등록 중 오류가 발생했습니다.");
    else { setDone(true); setTimeout(() => reset(), 2200); }
    setBusy(false);
  }

  function reset() { setPin(""); setCompany(null); setMealType("lunch"); setHeadcount(1); setMessage(""); setDone(false); }

  if (done) return <main className={`kiosk-shell done-${mealType}`}><section className="kiosk-card kiosk-done"><KioskClock/><div className="done-mark">✓</div><h1>등록되었습니다</h1><p>{company?.company_name} · {mealType === "lunch" ? "중식" : "석식"} {headcount}명</p><strong className="meal-wish">맛있는 식사하세요.</strong><span>잠시 후 PIN 입력 화면으로 돌아갑니다.</span></section></main>;

  return <main className="kiosk-shell"><section className="kiosk-card">
    <header className="kiosk-head"><div className="kiosk-brand-wrap"><div className="mini-brand">한끼</div><div><strong>한끼장부</strong><span>식수 입력</span></div></div><KioskClock/></header>
    {!company ? <>
      <div className="kiosk-title"><p>업체 PIN을 입력해 주세요</p><h1>오늘 식사 인원을 기록합니다</h1><span>아래 숫자패드에서 안내받은 4자리 번호를 눌러 주세요.</span></div>
      <div className="kiosk-pin-display" aria-label="입력한 업체 PIN">{[0,1,2,3].map((index)=><span key={index} className={pin.length>index?"filled":""}>{pin.length>index?"●":""}</span>)}</div>
      <div className="kiosk-keypad" aria-label="숫자패드">{[1,2,3,4,5,6,7,8,9].map((n)=><button type="button" key={n} onClick={()=>pressPinNumber(n)} disabled={busy}>{n}</button>)}<button type="button" className="keypad-action" onClick={clearPin} disabled={busy}>전체지움</button><button type="button" onClick={()=>pressPinNumber(0)} disabled={busy}>0</button><button type="button" className="keypad-action" onClick={backspacePin} disabled={busy}>⌫</button></div>
      <button type="button" className="btn primary kiosk-pin-confirm" onClick={identify} disabled={busy || pin.length !== 4}>{busy ? "확인 중..." : "업체 확인"}</button>
    </> : <>
      <div className="company-confirm"><span>확인된 업체</span><h1>{company.company_name}</h1><button onClick={reset}>다시 입력</button></div>
      <div className="meal-buttons"><button className={`lunch ${mealType === "lunch" ? "active" : ""}`} onClick={()=>setMealType("lunch")}><span>중식</span><strong>{Number(company.lunch_price).toLocaleString()}원</strong></button><button className={`dinner ${mealType === "dinner" ? "active" : ""}`} onClick={()=>setMealType("dinner")}><span>석식</span><strong>{Number(company.dinner_price).toLocaleString()}원</strong></button></div>
      <div className="headcount-box"><span>인원수</span><div className="quick-counts">{[1,2,3,4,5].map((n)=><button key={n} className={headcount===n?"active":""} onClick={()=>setHeadcount(n)}>{n}명</button>)}</div><div className="count-stepper"><button onClick={()=>setHeadcount(Math.max(1, headcount-1))}>−</button><strong>{headcount}명</strong><button onClick={()=>setHeadcount(Math.min(999, headcount+1))}>＋</button></div></div>
      <button className={`btn kiosk-submit ${mealType === "lunch" ? "lunch-submit" : "dinner-submit"}`} onClick={submitMeal} disabled={busy}>{busy ? "등록 중..." : `${mealType === "lunch" ? "중식" : "석식"} ${headcount}명 등록`}</button>
    </>}
    {message && <p className="error kiosk-message">{message}</p>}
  </section></main>;
}
