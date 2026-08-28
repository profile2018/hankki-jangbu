"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";

function monthBounds(value) {
  const [year, month] = value.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export default function SettlementPage() {
  const [restaurant, setRestaurant] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const p = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("month") : null;
    if (p) return p;
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.replace("/login"); return; }
      const { data: membership } = await supabase.from("restaurant_members").select("restaurant_id").eq("user_id", user.id).limit(1).maybeSingle();
      if (!membership?.restaurant_id) { window.location.replace("/onboarding"); return; }
      const [{ data: restaurantRow }, { data: companyRows }] = await Promise.all([
        supabase.from("restaurants").select("id,name").eq("id", membership.restaurant_id).single(),
        supabase.from("companies").select("id,company_no,name,lunch_price,dinner_price,contact_name,contact_email,is_active").eq("restaurant_id", membership.restaurant_id).order("company_no")
      ]);
      setRestaurant(restaurantRow || null);
      setCompanies(companyRows || []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!restaurant?.id) return;
    (async () => {
      setLoading(true);
      const supabase = createClient();
      const { start, end } = monthBounds(month);
      const { data } = await supabase.from("meal_records").select("id,company_id,meal_type,headcount,unit_price,occurred_at,cancelled_at").eq("restaurant_id", restaurant.id).is("cancelled_at", null).gte("occurred_at", start).lt("occurred_at", end).order("occurred_at");
      setRecords(data || []);
      setLoading(false);
    })();
  }, [restaurant?.id, month]);

  const rows = useMemo(() => {
    const map = new Map(companies.map((c) => [c.id, { ...c, lunchCount:0, dinnerCount:0, lunchAmount:0, dinnerAmount:0, totalCount:0, totalAmount:0 }]));
    records.forEach((r) => {
      if (!r.company_id || !map.has(r.company_id)) return;
      const row = map.get(r.company_id), count = Number(r.headcount || 0);
      const fallback = r.meal_type === "lunch" ? Number(row.lunch_price || 0) : Number(row.dinner_price || 0);
      const unit = Number(r.unit_price || fallback);
      if (r.meal_type === "lunch") { row.lunchCount += count; row.lunchAmount += count * unit; }
      if (r.meal_type === "dinner") { row.dinnerCount += count; row.dinnerAmount += count * unit; }
      row.totalCount += count; row.totalAmount += count * unit;
    });
    return Array.from(map.values()).filter((r) => r.totalCount > 0);
  }, [companies, records]);

  const totals = useMemo(() => rows.reduce((a,r)=>({lunch:a.lunch+r.lunchCount,dinner:a.dinner+r.dinnerCount,count:a.count+r.totalCount,amount:a.amount+r.totalAmount}),{lunch:0,dinner:0,count:0,amount:0}),[rows]);

  function emailHref(r) {
    const monthText = `${month.slice(0,4)}년 ${Number(month.slice(5,7))}월`;
    const subject = `${restaurant?.name || "한끼장부"} ${monthText} 식대 정산서`;
    const body = `${r.name} 담당자님, 안녕하세요.\n\n${monthText} 식대 정산내역입니다.\n중식 ${r.lunchCount}명 / 석식 ${r.dinnerCount}명\n총 식수 ${r.totalCount}명\n청구금액 ${r.totalAmount.toLocaleString()}원\n\n정산서 미리보기에서 PDF로 저장해 첨부해 주세요.\n감사합니다.`;
    return `mailto:${encodeURIComponent(r.contact_email || "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return <main className="dashboard-shell settlement-shell">
    <header className="topbar"><div><strong>한끼장부</strong><span>{restaurant?.name || "월별 정산"}</span></div><a className="btn secondary" href="/dashboard">오늘 현황으로</a></header>
    <section className="settlement-hero"><div><p>월별 정산</p><h1>거래처별 식수와 청구금액</h1><span>취소되지 않은 식수 기록을 기준으로 자동 집계합니다.</span></div><label>정산 월<input type="month" value={month} onChange={(e)=>setMonth(e.target.value)} /></label></section>
    <section className="cards settlement-cards"><article><span>중식</span><strong>{totals.lunch.toLocaleString()}명</strong></article><article><span>석식</span><strong>{totals.dinner.toLocaleString()}명</strong></article><article><span>총 식수</span><strong>{totals.count.toLocaleString()}명</strong></article><article><span>예상 청구액</span><strong>{totals.amount.toLocaleString()}원</strong></article></section>
    <section className="company-section"><div className="section-head"><div><h2>{month.replace("-","년 ")}월 거래처별 정산</h2><p>금액을 확인한 뒤 거래처별 정산서를 바로 미리보거나 이메일을 작성할 수 있습니다.</p></div></div>
      {loading ? <div className="empty-state"><strong>정산 내역을 불러오고 있습니다.</strong></div> : rows.length===0 ? <div className="empty-state"><strong>이 달에 정산할 식수 기록이 없습니다.</strong><span>키오스크 식수가 등록되면 자동으로 집계됩니다.</span></div> : <div className="settlement-company-cards">{rows.map(r=><article className="settlement-company-card" key={r.id}><div className="settlement-company-title"><div><strong>{r.name}</strong><span>업체번호 {r.company_no}{r.contact_name ? ` · 담당 ${r.contact_name}` : ""}</span></div><b>{r.totalAmount.toLocaleString()}원</b></div><div className="settlement-company-numbers"><span>중식 <strong>{r.lunchCount.toLocaleString()}명</strong></span><span>석식 <strong>{r.dinnerCount.toLocaleString()}명</strong></span><span>총 식수 <strong>{r.totalCount.toLocaleString()}명</strong></span></div><div className="settlement-card-actions"><a className="btn primary" href={`/settlement/statement?company=${r.id}&month=${month}`} target="_blank" rel="noreferrer">정산서 미리보기</a><a className="btn secondary" href={emailHref(r)}>이메일 보내기</a></div>{!r.contact_email&&<small className="settlement-email-note">담당자 이메일이 등록되지 않아 이메일 주소는 직접 입력해야 합니다.</small>}</article>)}</div>}
    </section>
    <section className="company-section settlement-next"><div><h2>PDF 정산서</h2><p><strong>정산서 미리보기</strong>에서 내용을 확인하고 <strong>PDF 저장 · 인쇄</strong>를 누르면 PDF 파일로 저장할 수 있습니다.</p></div><span className="settlement-ready">사용 가능</span></section>
  </main>;
}
