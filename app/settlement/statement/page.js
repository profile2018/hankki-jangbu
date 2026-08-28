"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";

function monthBounds(value) {
  const [year, month] = value.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export default function SettlementStatementPage() {
  const params = useSearchParams();
  const companyId = params.get("company");
  const month = params.get("month") || "";
  const [restaurant, setRestaurant] = useState(null);
  const [company, setCompany] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId || !month) { setLoading(false); return; }
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.replace("/login"); return; }
      const { data: membership } = await supabase.from("restaurant_members").select("restaurant_id").eq("user_id", user.id).limit(1).maybeSingle();
      if (!membership?.restaurant_id) { window.location.replace("/onboarding"); return; }
      const { start, end } = monthBounds(month);
      const [{ data: restaurantRow }, { data: companyRow }, { data: mealRows }] = await Promise.all([
        supabase.from("restaurants").select("id,name,phone").eq("id", membership.restaurant_id).single(),
        supabase.from("companies").select("id,restaurant_id,company_no,name,lunch_price,dinner_price,contact_name,contact_email").eq("id", companyId).eq("restaurant_id", membership.restaurant_id).single(),
        supabase.from("meal_records").select("id,company_id,meal_type,headcount,unit_price,occurred_at,cancelled_at").eq("restaurant_id", membership.restaurant_id).eq("company_id", companyId).is("cancelled_at", null).gte("occurred_at", start).lt("occurred_at", end).order("occurred_at")
      ]);
      setRestaurant(restaurantRow || null);
      setCompany(companyRow || null);
      setRecords(mealRows || []);
      setLoading(false);
    })();
  }, [companyId, month]);

  const dailyRows = useMemo(() => {
    if (!company) return [];
    const map = new Map();
    records.forEach((r) => {
      const date = new Date(r.occurred_at).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
      if (!map.has(date)) map.set(date, { date, lunch: 0, dinner: 0, amount: 0 });
      const row = map.get(date);
      const count = Number(r.headcount || 0);
      const fallback = r.meal_type === "lunch" ? Number(company.lunch_price || 0) : Number(company.dinner_price || 0);
      const unit = Number(r.unit_price || fallback);
      if (r.meal_type === "lunch") row.lunch += count;
      if (r.meal_type === "dinner") row.dinner += count;
      row.amount += count * unit;
    });
    return Array.from(map.values());
  }, [records, company]);

  const summary = useMemo(() => {
    if (!company) return { lunch: 0, dinner: 0, lunchAmount: 0, dinnerAmount: 0, total: 0, amount: 0 };
    let lunch = 0, dinner = 0, lunchAmount = 0, dinnerAmount = 0;
    records.forEach((r) => {
      const count = Number(r.headcount || 0);
      const fallback = r.meal_type === "lunch" ? Number(company.lunch_price || 0) : Number(company.dinner_price || 0);
      const unit = Number(r.unit_price || fallback);
      if (r.meal_type === "lunch") { lunch += count; lunchAmount += count * unit; }
      if (r.meal_type === "dinner") { dinner += count; dinnerAmount += count * unit; }
    });
    return { lunch, dinner, lunchAmount, dinnerAmount, total: lunch + dinner, amount: lunchAmount + dinnerAmount };
  }, [records, company]);

  if (loading) return <main className="center-shell"><div className="form-card"><p className="helper">정산서를 만들고 있습니다...</p></div></main>;
  if (!company || !restaurant) return <main className="center-shell"><div className="form-card"><p className="error">정산서 정보를 찾을 수 없습니다.</p><a className="btn secondary" href="/settlement">월별 정산으로 돌아가기</a></div></main>;

  const monthText = `${month.slice(0,4)}년 ${Number(month.slice(5,7))}월`;
  const subject = `${restaurant.name} ${monthText} 식대 정산서`;
  const body = `${company.name} 담당자님, 안녕하세요.\n\n${monthText} 식대 정산내역을 보내드립니다.\n총 식수: ${summary.total}명\n청구금액: ${summary.amount.toLocaleString()}원\n\n감사합니다.\n${restaurant.name}`;
  const mailHref = `mailto:${encodeURIComponent(company.contact_email || "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return <main className="statement-shell">
    <div className="statement-toolbar no-print"><a className="btn secondary" href={`/settlement?month=${month}`}>정산 목록</a><div><a className="btn secondary" href={mailHref}>이메일 작성</a><button className="btn primary" onClick={() => window.print()}>PDF 저장 · 인쇄</button></div></div>
    <article className="statement-paper">
      <header className="statement-head"><div><span>한끼장부</span><h1>식대 정산서</h1><p>{monthText}</p></div><div className="statement-brand"><strong>{restaurant.name}</strong>{restaurant.phone && <span>{restaurant.phone}</span>}</div></header>
      <section className="statement-parties"><div><span>공급자</span><strong>{restaurant.name}</strong></div><div><span>청구처</span><strong>{company.name}</strong><small>업체번호 {company.company_no}{company.contact_name ? ` · 담당 ${company.contact_name}` : ""}</small></div></section>
      <section className="statement-summary"><div><span>중식</span><strong>{summary.lunch.toLocaleString()}명</strong><small>{summary.lunchAmount.toLocaleString()}원</small></div><div><span>석식</span><strong>{summary.dinner.toLocaleString()}명</strong><small>{summary.dinnerAmount.toLocaleString()}원</small></div><div><span>총 식수</span><strong>{summary.total.toLocaleString()}명</strong></div><div className="amount"><span>청구금액</span><strong>{summary.amount.toLocaleString()}원</strong></div></section>
      <section className="statement-detail"><h2>일자별 이용내역</h2><table><thead><tr><th>일자</th><th>중식</th><th>석식</th><th>금액</th></tr></thead><tbody>{dailyRows.length ? dailyRows.map((r) => <tr key={r.date}><td>{r.date}</td><td>{r.lunch}명</td><td>{r.dinner}명</td><td>{r.amount.toLocaleString()}원</td></tr>) : <tr><td colSpan="4">이용내역이 없습니다.</td></tr>}</tbody><tfoot><tr><td>합계</td><td>{summary.lunch}명</td><td>{summary.dinner}명</td><td>{summary.amount.toLocaleString()}원</td></tr></tfoot></table></section>
      <footer className="statement-footer"><p>본 정산서는 한끼장부에 기록된 취소되지 않은 식수 내역을 기준으로 작성되었습니다.</p><strong>{restaurant.name}</strong></footer>
    </article>
  </main>;
}
