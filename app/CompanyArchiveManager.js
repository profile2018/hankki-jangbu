"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "../lib/supabase/client";

export default function CompanyArchiveManager() {
  const [mounted, setMounted] = useState(false);
  const [target, setTarget] = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (window.location.pathname !== "/dashboard") return;
    setMounted(true);
    setTarget(document.querySelector(".dashboard-shell"));
    (async () => {
      const s = createClient();
      const { data: { user } } = await s.auth.getUser();
      if (!user) return;
      const { data: member } = await s.from("restaurant_members").select("restaurant_id").eq("user_id", user.id).limit(1).maybeSingle();
      if (!member?.restaurant_id) return;
      setRestaurantId(member.restaurant_id);
      await load(member.restaurant_id);
    })();
  }, []);

  async function load(id = restaurantId) {
    if (!id) return;
    const s = createClient();
    const { data, error } = await s.from("companies").select("id,company_no,name,is_active").eq("restaurant_id", id).order("company_no");
    if (error) setMessage("거래처 목록을 불러오지 못했습니다.");
    else setCompanies(data || []);
  }

  async function setActive(company, nextActive) {
    const action = nextActive ? "복구" : "사용중지/보관";
    const warning = nextActive
      ? `${company.name} 거래처를 다시 사용하시겠습니까? 키오스크에도 다시 표시됩니다.`
      : `${company.name} 거래처를 사용중지/보관하시겠습니까? 기존 식수·정산 기록은 삭제되지 않고 보존되며 키오스크에서는 숨겨집니다.`;
    if (!window.confirm(warning)) return;
    setBusyId(company.id);
    setMessage("");
    const s = createClient();
    const { error } = await s.from("companies").update({ is_active: nextActive }).eq("id", company.id).eq("restaurant_id", restaurantId);
    if (error) setMessage(`${action} 처리 중 오류가 발생했습니다: ${error.message}`);
    else {
      setMessage(nextActive ? `${company.name} 거래처를 복구했습니다.` : `${company.name} 거래처를 보관했습니다. 기존 기록은 그대로 유지됩니다.`);
      await load();
    }
    setBusyId(null);
  }

  if (!mounted || !target) return null;
  const active = companies.filter(c => c.is_active !== false);
  const archived = companies.filter(c => c.is_active === false);

  return createPortal(
    <section className="company-section company-archive-section">
      <div className="section-head">
        <div>
          <h2>거래처 사용 · 보관 관리</h2>
          <p>거래가 끝난 업체는 삭제하지 않고 보관하여 과거 식수·정산 기록을 안전하게 유지합니다.</p>
        </div>
      </div>
      {message && <p className="notice">{message}</p>}
      <h3 className="form-subtitle">사용 중인 거래처</h3>
      <div className="company-list">
        {active.length ? active.map(c => <article key={c.id} className="company-manage-row">
          <div><strong>{c.name}</strong><span>업체번호 {c.company_no}</span></div>
          <div><span>상태</span><strong>사용 중</strong></div>
          <div></div>
          <div><button className="record-cancel" disabled={busyId === c.id} onClick={() => setActive(c, false)}>{busyId === c.id ? "처리 중..." : "사용중지/보관"}</button></div>
        </article>) : <div className="empty-state">사용 중인 거래처가 없습니다.</div>}
      </div>
      <h3 className="form-subtitle" style={{marginTop:"24px"}}>보관된 거래처</h3>
      <div className="company-list">
        {archived.length ? archived.map(c => <article key={c.id} className="company-manage-row">
          <div><strong>{c.name}</strong><span>업체번호 {c.company_no}</span></div>
          <div><span>상태</span><strong>보관</strong></div>
          <div><span>과거 기록</span><strong>보존</strong></div>
          <div><button className="record-edit" disabled={busyId === c.id} onClick={() => setActive(c, true)}>{busyId === c.id ? "처리 중..." : "복구"}</button></div>
        </article>) : <div className="empty-state">보관된 거래처가 없습니다.</div>}
      </div>
    </section>,
    target
  );
}
