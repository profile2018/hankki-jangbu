"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export default function DashboardPage() {
  const [restaurant, setRestaurant] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [mealRecords, setMealRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [upgradeNotice, setUpgradeNotice] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [form, setForm] = useState({ company_no: "", name: "", company_pin: "", lunch_price: "", dinner_price: "", contact_name: "", contact_email: "" });

  async function loadTodayMeals(restaurantId) {
    if (!restaurantId) return;
    const supabase = createClient();
    const { start, end } = getTodayRange();
    const { data } = await supabase
      .from("meal_records")
      .select("id,company_id,meal_type,headcount,occurred_at")
      .eq("restaurant_id", restaurantId)
      .gte("occurred_at", start)
      .lt("occurred_at", end)
      .order("occurred_at", { ascending: false });
    setMealRecords(data || []);
    setLastUpdated(new Date());
  }

  useEffect(() => {
    let active = true;
    let timer;
    let currentRestaurantId = null;

    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.replace("/login"); return; }
      const { data: membership } = await supabase.from("restaurant_members").select("restaurant_id").eq("user_id", user.id).limit(1).maybeSingle();
      if (!membership?.restaurant_id) { window.location.replace("/onboarding"); return; }
      currentRestaurantId = membership.restaurant_id;
      const { data } = await supabase.from("restaurants").select("id,name,default_lunch_price,default_dinner_price,trial_started_at,trial_ends_at").eq("id", membership.restaurant_id).single();
      const { data: companyRows } = await supabase.from("companies").select("id,company_no,name,lunch_price,dinner_price,contact_name,contact_email,is_active").eq("restaurant_id", membership.restaurant_id).order("company_no");
      if (active) {
        setRestaurant(data || null);
        setCompanies(companyRows || []);
        setForm((f) => ({ ...f, lunch_price: String(data?.default_lunch_price ?? 0), dinner_price: String(data?.default_dinner_price ?? 0) }));
        await loadTodayMeals(membership.restaurant_id);
        setLoading(false);
        timer = setInterval(() => loadTodayMeals(membership.restaurant_id), 15000);
      }
    })();

    function handleVisibility() {
      if (document.visibilityState === "visible" && currentRestaurantId) loadTodayMeals(currentRestaurantId);
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      active = false;
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  async function logout() { const supabase = createClient(); await supabase.auth.signOut(); window.location.replace("/"); }
  function change(e) { const { name, value } = e.target; setForm({ ...form, [name]: name === "company_pin" ? value.replace(/\D/g, "").slice(0, 4) : value }); }

  async function saveCompany(e) {
    e.preventDefault(); setMessage("");
    if (!/^\d{4}$/.test(form.company_pin)) { setMessage("업체 PIN은 숫자 4자리로 입력해 주세요."); return; }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("create_company_with_pin", { p_restaurant_id: restaurant.id, p_company_no: form.company_no.trim(), p_name: form.name.trim(), p_pin: form.company_pin, p_lunch_price: Number(form.lunch_price || 0), p_dinner_price: Number(form.dinner_price || 0), p_contact_name: form.contact_name.trim() || null, p_contact_email: form.contact_email.trim() || null });
    if (error) {
      const text = error.message || "";
      if (text.toLowerCase().includes("duplicate") && text.toLowerCase().includes("pin")) setMessage("이미 사용 중인 업체 PIN입니다. 다른 번호를 지정해 주세요.");
      else if (text.toLowerCase().includes("duplicate")) setMessage("이미 등록된 업체번호 또는 업체 정보가 있습니다.");
      else setMessage(text || "거래처 등록 중 오류가 발생했습니다.");
    } else {
      const { data: companyRows } = await supabase.from("companies").select("id,company_no,name,lunch_price,dinner_price,contact_name,contact_email,is_active").eq("restaurant_id", restaurant.id).order("company_no");
      setCompanies(companyRows || []);
      const issuedPin = form.company_pin;
      setForm({ company_no: "", name: "", company_pin: "", lunch_price: String(restaurant.default_lunch_price ?? 0), dinner_price: String(restaurant.default_dinner_price ?? 0), contact_name: "", contact_email: "" });
      setMessage(`거래처가 등록되었습니다. 업체에 안내할 PIN은 ${issuedPin} 입니다.`); setShowCompanyForm(false);
    }
    setSaving(false);
  }

  const mealSummary = useMemo(() => {
    const companyMap = new Map(companies.map((c) => [c.id, c.name]));
    let lunch = 0;
    let dinner = 0;
    const rows = new Map();

    mealRecords.forEach((record) => {
      const count = Number(record.headcount || 0);
      if (record.meal_type === "lunch") lunch += count;
      if (record.meal_type === "dinner") dinner += count;

      const key = record.company_id || "guest";
      if (!rows.has(key)) rows.set(key, { id: key, name: record.company_id ? (companyMap.get(record.company_id) || "등록 업체") : "기타 손님", lunch: 0, dinner: 0, total: 0, lastTime: record.occurred_at });
      const row = rows.get(key);
      if (record.meal_type === "lunch") row.lunch += count;
      if (record.meal_type === "dinner") row.dinner += count;
      row.total += count;
      if (new Date(record.occurred_at) > new Date(row.lastTime)) row.lastTime = record.occurred_at;
    });

    return { lunch, dinner, total: lunch + dinner, rows: Array.from(rows.values()).sort((a, b) => b.total - a.total) };
  }, [mealRecords, companies]);

  if (loading) return <main className="center-shell"><div className="form-card"><p className="helper">식당 정보를 불러오고 있습니다...</p></div></main>;
  const now = new Date(); const end = restaurant?.trial_ends_at ? new Date(restaurant.trial_ends_at) : null; const trialDays = end ? Math.max(0, Math.ceil((end - now) / 86400000)) : 0;
  const premiumFeatures = [
    { icon: "📷", title: "식자재 매입관리", text: "거래명세서를 촬영해 거래처·품목·금액을 자동 등록합니다." },
    { icon: "📈", title: "매입·경영 분석", text: "식자재 매입과 식수 매출을 비교해 월별 경영 현황을 분석합니다." },
    { icon: "🧾", title: "전자세금계산서 발행", text: "월말 정산내역을 바탕으로 전자세금계산서 발행을 지원합니다." }
  ];

  return <main className="dashboard-shell">
    <header className="topbar"><div><strong>한끼장부</strong><span>{restaurant?.name || "사장님 관리"}</span></div><button onClick={logout}>로그아웃</button></header>
    <section className="hero"><p>오늘 현황</p><h1>{companies.length ? `오늘 총 ${mealSummary.total}명이 식사했습니다` : "거래처를 먼저 등록해 주세요"}</h1><p>{companies.length ? "키오스크에 입력된 식수 현황을 자동으로 확인합니다." : "사장님이 업체별 PIN을 부여하면 직원들이 키오스크에서 PIN으로 식수를 입력할 수 있습니다."}</p></section>
    <section className="cards"><article><span>오늘 중식</span><strong>{mealSummary.lunch}명</strong></article><article><span>오늘 석식</span><strong>{mealSummary.dinner}명</strong></article><article><span>등록 거래처</span><strong>{companies.length}곳</strong></article><article><span>무료체험</span><strong>{trialDays}일</strong></article></section>

    <section className="company-section">
      <div className="section-head"><div><h2>오늘 업체별 식수 현황</h2><p>{lastUpdated ? `최근 확인 ${lastUpdated.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} · 약 15초마다 자동 갱신` : "오늘 등록된 식수를 확인합니다."}</p></div><button className="btn secondary" onClick={() => loadTodayMeals(restaurant.id)}>새로고침</button></div>
      <div className="company-list">{mealSummary.rows.length === 0 ? <div className="empty-state"><strong>오늘 등록된 식수가 없습니다.</strong><span>키오스크에서 식수를 등록하면 이곳에 표시됩니다.</span></div> : mealSummary.rows.map((row) => <article key={row.id}><div><strong>{row.name}</strong><span>{new Date(row.lastTime).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 최근 입력</span></div><div><span>중식</span><strong>{row.lunch}명</strong></div><div><span>석식</span><strong>{row.dinner}명</strong></div><div><span>합계</span><strong>{row.total}명</strong></div></article>)}</div>
    </section>

    <section className="company-section">
      <div className="section-head"><div><h2>거래처 관리</h2><p>식당 사장님이 거래처와 식수 입력용 PIN을 관리합니다.</p></div><div className="section-actions">{restaurant?.id && <a className="btn secondary" href={`/kiosk?r=${restaurant.id}`} target="_blank" rel="noreferrer">키오스크 화면 열기</a>}<button className="btn primary" onClick={() => { setMessage(""); setShowCompanyForm(!showCompanyForm); }}>{showCompanyForm ? "닫기" : "+ 거래처 등록"}</button></div></div>
      {message && <p className={message.includes("등록되었습니다") ? "notice" : "error"}>{message}</p>}
      {showCompanyForm && <form className="company-form" onSubmit={saveCompany}>
        <div className="grid2"><label>업체번호 *<input name="company_no" value={form.company_no} onChange={change} required placeholder="예) 101" /></label><label>업체명 *<input name="name" value={form.name} onChange={change} required placeholder="예) 창조티엔에프" /></label></div>
        <div className="grid2"><label>업체 PIN 4자리 *<input name="company_pin" value={form.company_pin} onChange={change} required inputMode="numeric" maxLength={4} placeholder="예) 1234" /><small>사장님이 PIN을 정해 업체에 알려주면 직원이 키오스크에서 입력합니다.</small></label><label>담당자명<input name="contact_name" value={form.contact_name} onChange={change} placeholder="선택 입력" /></label></div>
        <div className="grid2"><label>중식 단가<input name="lunch_price" type="number" min="0" value={form.lunch_price} onChange={change} /></label><label>석식 단가<input name="dinner_price" type="number" min="0" value={form.dinner_price} onChange={change} /></label></div>
        <label>담당자 이메일<input name="contact_email" type="email" value={form.contact_email} onChange={change} placeholder="선택 입력" /></label>
        <button className="btn primary" disabled={saving}>{saving ? "등록 중..." : "거래처 등록하기"}</button>
      </form>}
      <div className="company-list">{companies.length === 0 ? <div className="empty-state"><strong>아직 등록된 거래처가 없습니다.</strong><span>위의 거래처 등록 버튼을 눌러 첫 업체를 등록해 주세요.</span></div> : companies.map((c) => <article key={c.id}><div><strong>{c.name}</strong><span>업체번호 {c.company_no}</span></div><div><span>식수 PIN</span><strong>설정됨</strong></div><div><span>중식</span><strong>{Number(c.lunch_price).toLocaleString()}원</strong></div><div><span>석식</span><strong>{Number(c.dinner_price).toLocaleString()}원</strong></div></article>)}</div>
    </section>
    <section className="company-section premium-section">
      <div className="section-head"><div><h2>업그레이드 기능</h2><p>한끼장부를 더 편리하게 사용할 수 있는 추가 기능입니다.</p></div></div>
      <div className="premium-grid">{premiumFeatures.map((f) => <button key={f.title} className="premium-card" onClick={() => setUpgradeNotice(f)}><span className="premium-icon">{f.icon}</span><div><strong>{f.title}</strong><p>{f.text}</p></div><b>추가 기능</b></button>)}</div>
    </section>
    {upgradeNotice && <div className="modal-backdrop" onClick={() => setUpgradeNotice(null)}><div className="upgrade-modal" onClick={(e) => e.stopPropagation()}><span className="premium-icon">{upgradeNotice.icon}</span><h2>{upgradeNotice.title}</h2><p>{upgradeNotice.text}</p><div className="upgrade-note">이 기능은 추가 결제가 필요한 업그레이드 기능입니다.</div><button className="btn primary" onClick={() => setUpgradeNotice(null)}>확인</button></div></div>}
  </main>;
}
