"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

export default function DashboardPage() {
  const [restaurant, setRestaurant] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ company_no: "", name: "", company_pin: "", lunch_price: "", dinner_price: "", contact_name: "", contact_email: "" });

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.replace("/login"); return; }
      const { data: membership } = await supabase.from("restaurant_members").select("restaurant_id").eq("user_id", user.id).limit(1).maybeSingle();
      if (!membership?.restaurant_id) { window.location.replace("/onboarding"); return; }
      const { data } = await supabase.from("restaurants").select("id,name,default_lunch_price,default_dinner_price,trial_started_at,trial_ends_at").eq("id", membership.restaurant_id).single();
      const { data: companyRows } = await supabase.from("companies").select("id,company_no,name,lunch_price,dinner_price,contact_name,contact_email,is_active").eq("restaurant_id", membership.restaurant_id).order("company_no");
      if (active) {
        setRestaurant(data || null);
        setCompanies(companyRows || []);
        setForm((f) => ({ ...f, lunch_price: String(data?.default_lunch_price ?? 0), dinner_price: String(data?.default_dinner_price ?? 0) }));
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  async function logout() { const supabase = createClient(); await supabase.auth.signOut(); window.location.replace("/"); }
  function change(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  async function saveCompany(e) {
    e.preventDefault();
    setMessage("");
    if (!/^\d{4}$/.test(form.company_pin)) { setMessage("업체 PIN은 숫자 4자리로 입력해 주세요."); return; }
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("register_company_with_pin", {
      p_restaurant_id: restaurant.id,
      p_company_no: form.company_no.trim(),
      p_name: form.name.trim(),
      p_pin: form.company_pin,
      p_lunch_price: Number(form.lunch_price || 0),
      p_dinner_price: Number(form.dinner_price || 0),
      p_contact_name: form.contact_name.trim() || null,
      p_contact_email: form.contact_email.trim() || null
    });

    const row = Array.isArray(data) ? data[0] : data;
    if (error) {
      const text = error.message || "";
      if (text.includes("duplicate company no")) setMessage("업체번호가 이미 등록되어 있습니다.");
      else if (text.includes("duplicate company pin")) setMessage("이미 사용 중인 업체 PIN입니다. 다른 번호를 지정해 주세요.");
      else setMessage(text || "거래처 등록 중 오류가 발생했습니다.");
    } else if (row) {
      setCompanies((rows) => [...rows, row]);
      const issuedPin = form.company_pin;
      setForm({ company_no: "", name: "", company_pin: "", lunch_price: String(restaurant.default_lunch_price ?? 0), dinner_price: String(restaurant.default_dinner_price ?? 0), contact_name: "", contact_email: "" });
      setMessage(`거래처가 등록되었습니다. 업체에 안내할 PIN은 ${issuedPin} 입니다.`);
      setShowCompanyForm(false);
    }
    setSaving(false);
  }

  if (loading) return <main className="center-shell"><div className="form-card"><p className="helper">식당 정보를 불러오고 있습니다...</p></div></main>;
  const now = new Date();
  const end = restaurant?.trial_ends_at ? new Date(restaurant.trial_ends_at) : null;
  const trialDays = end ? Math.max(0, Math.ceil((end - now) / 86400000)) : 0;

  return <main className="dashboard-shell">
    <header className="topbar"><div><strong>한끼장부</strong><span>{restaurant?.name || "사장님 관리"}</span></div><button onClick={logout}>로그아웃</button></header>
    <section className="hero"><p>오늘 현황</p><h1>{companies.length ? "식수 관리" : "거래처를 먼저 등록해 주세요"}</h1><p>{companies.length ? "등록된 거래처와 오늘 식수 현황을 관리합니다." : "사장님이 업체별 PIN을 부여하면 직원들이 키오스크에서 PIN으로 식수를 입력할 수 있습니다."}</p></section>
    <section className="cards"><article><span>오늘 중식</span><strong>0명</strong></article><article><span>오늘 석식</span><strong>0명</strong></article><article><span>등록 거래처</span><strong>{companies.length}곳</strong></article><article><span>무료체험</span><strong>{trialDays}일</strong></article></section>

    <section className="company-section">
      <div className="section-head"><div><h2>거래처 관리</h2><p>식당 사장님이 거래처와 식수 입력용 PIN을 관리합니다.</p></div><div className="section-actions">{restaurant?.id && <a className="btn secondary" href={`/kiosk?r=${restaurant.id}`} target="_blank" rel="noreferrer">키오스크 화면 열기</a>}<button className="btn primary" onClick={() => { setMessage(""); setShowCompanyForm(!showCompanyForm); }}>{showCompanyForm ? "닫기" : "+ 거래처 등록"}</button></div></div>
      {message && <p className={message.includes("등록되었습니다") ? "notice" : "error"}>{message}</p>}
      {showCompanyForm && <form className="company-form" onSubmit={saveCompany}>
        <div className="grid2"><label>업체번호 *<input name="company_no" value={form.company_no} onChange={change} required placeholder="예) 101" /></label><label>업체명 *<input name="name" value={form.name} onChange={change} required placeholder="예) 창조티엔에프" /></label></div>
        <div className="grid2"><label>업체 PIN 4자리 *<input name="company_pin" value={form.company_pin} onChange={change} required inputMode="numeric" maxLength={4} placeholder="예) 1234" /><small>PIN은 암호화하여 저장되며 사장님이 해당 업체에 알려줍니다.</small></label><label>담당자명<input name="contact_name" value={form.contact_name} onChange={change} placeholder="선택 입력" /></label></div>
        <div className="grid2"><label>중식 단가<input name="lunch_price" type="number" min="0" value={form.lunch_price} onChange={change} /></label><label>석식 단가<input name="dinner_price" type="number" min="0" value={form.dinner_price} onChange={change} /></label></div>
        <label>담당자 이메일<input name="contact_email" type="email" value={form.contact_email} onChange={change} placeholder="선택 입력" /></label>
        <button className="btn primary" disabled={saving}>{saving ? "등록 중..." : "거래처 등록하기"}</button>
      </form>}
      <div className="company-list">{companies.length === 0 ? <div className="empty-state"><strong>아직 등록된 거래처가 없습니다.</strong><span>위의 거래처 등록 버튼을 눌러 첫 업체를 등록해 주세요.</span></div> : companies.map((c) => <article key={c.id}><div><strong>{c.name}</strong><span>업체번호 {c.company_no}</span></div><div><span>식수 PIN</span><strong>설정됨</strong></div><div><span>중식</span><strong>{Number(c.lunch_price).toLocaleString()}원</strong></div><div><span>석식</span><strong>{Number(c.dinner_price).toLocaleString()}원</strong></div></article>)}</div>
    </section>
  </main>;
}
