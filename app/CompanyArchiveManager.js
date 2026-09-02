"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "../lib/supabase/client";

export default function CompanyArchiveManager() {
  const [mounted, setMounted] = useState(false);
  const [dashboardTarget, setDashboardTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (window.location.pathname !== "/dashboard") return;
    setMounted(true);
    setDashboardTarget(document.querySelector(".dashboard-shell"));

    const observer = new MutationObserver(() => {
      setEditTarget(document.querySelector(".company-edit-modal"));
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setEditTarget(document.querySelector(".company-edit-modal"));

    (async () => {
      const s = createClient();
      const { data: { user } } = await s.auth.getUser();
      if (!user) return;
      const { data: member } = await s.from("restaurant_members").select("restaurant_id").eq("user_id", user.id).limit(1).maybeSingle();
      if (!member?.restaurant_id) return;
      setRestaurantId(member.restaurant_id);
      await load(member.restaurant_id);
    })();

    return () => observer.disconnect();
  }, []);

  async function load(id = restaurantId) {
    if (!id) return;
    const s = createClient();
    const { data, error } = await s.from("companies").select("id,company_no,name,is_active").eq("restaurant_id", id).order("company_no");
    if (error) setMessage("거래처 목록을 불러오지 못했습니다.");
    else setCompanies(data || []);
  }

  const active = useMemo(() => companies.filter(c => c.is_active !== false), [companies]);
  const archived = useMemo(() => companies.filter(c => c.is_active === false), [companies]);

  useEffect(() => {
    if (!mounted) return;
    const section = [...document.querySelectorAll(".company-section")].find(s => s.querySelector("h2")?.textContent?.trim() === "거래처 관리");
    if (section) {
      const archivedNames = new Set(archived.map(c => c.name));
      section.querySelectorAll(".company-list > .company-manage-row").forEach(row => {
        const name = row.querySelector("strong")?.textContent?.trim();
        row.style.display = archivedNames.has(name) ? "none" : "";
      });
    }
    const count = document.querySelector(".cards article:nth-child(3) strong");
    if (count) count.textContent = `${active.length}곳`;
  }, [mounted, active, archived]);

  async function setActive(company, nextActive) {
    const warning = nextActive
      ? `${company.name} 거래처를 다시 사용하시겠습니까? 키오스크에도 다시 표시됩니다.`
      : `${company.name} 거래처를 보관하시겠습니까?\n\n키오스크와 현재 거래처 목록에서는 숨겨지지만 기존 식수·정산 기록은 그대로 보존됩니다.`;
    if (!window.confirm(warning)) return;
    setBusyId(company.id);
    setMessage("");
    const s = createClient();
    const { error } = await s.from("companies").update({ is_active: nextActive }).eq("id", company.id).eq("restaurant_id", restaurantId);
    if (error) {
      setMessage(`${nextActive ? "복구" : "보관"} 처리 중 오류가 발생했습니다: ${error.message}`);
      setBusyId(null);
      return;
    }
    setMessage(nextActive ? `${company.name} 거래처를 복구했습니다.` : `${company.name} 거래처를 보관했습니다. 기존 기록은 그대로 유지됩니다.`);
    await load();
    setBusyId(null);
    if (!nextActive) {
      setTimeout(() => {
        const close = editTarget?.querySelector('.modal-actions .secondary');
        if (close) close.click();
      }, 0);
    }
  }

  const editingCompany = useMemo(() => {
    if (!editTarget) return null;
    const name = editTarget.querySelector("p")?.textContent?.trim();
    return companies.find(c => c.name === name) || null;
  }, [editTarget, companies]);

  if (!mounted || !dashboardTarget) return null;

  return <>
    {createPortal(
      <section className="company-section company-archive-section">
        <div className="section-head">
          <div>
            <h2>보관된 거래처</h2>
            <p>거래가 끝난 업체를 보관하면 과거 식수·정산 기록은 유지되고 키오스크에서는 숨겨집니다.</p>
          </div>
          <span className="archive-count">{archived.length}곳</span>
        </div>
        {message && <p className="notice">{message}</p>}
        <div className="company-list">
          {archived.length ? archived.map(c => <article key={c.id} className="company-archive-row">
            <div><strong>{c.name}</strong><span>업체번호 {c.company_no}</span></div>
            <div><span>상태</span><strong>보관 중</strong></div>
            <div><span>과거 기록</span><strong>보존</strong></div>
            <div><button className="record-edit" disabled={busyId === c.id} onClick={() => setActive(c, true)}>{busyId === c.id ? "처리 중..." : "거래처 복구"}</button></div>
          </article>) : <div className="empty-state">보관된 거래처가 없습니다.</div>}
        </div>
      </section>,
      dashboardTarget
    )}

    {editTarget && editingCompany && editingCompany.is_active !== false && createPortal(
      <div style={{marginTop:"6px",padding:"14px",border:"1px solid #f5c2c0",borderRadius:"12px",background:"#fff7f6"}}>
        <strong style={{display:"block",color:"#b42318",marginBottom:"6px"}}>거래가 종료된 업체인가요?</strong>
        <span style={{display:"block",fontSize:"13px",lineHeight:1.5,color:"#667085",marginBottom:"10px"}}>완전 삭제 대신 보관 처리합니다. 과거 식수와 정산 기록은 그대로 유지됩니다.</span>
        <button type="button" className="record-cancel" disabled={busyId === editingCompany.id} onClick={() => setActive(editingCompany, false)}>{busyId === editingCompany.id ? "보관 처리 중..." : "거래처 보관"}</button>
      </div>,
      editTarget
    )}
  </>;
}
