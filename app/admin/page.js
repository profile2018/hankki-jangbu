"use client";

import {useEffect,useMemo,useState} from "react";
import {createClient} from "../../lib/supabase/client";

function statusLabel(status){return status==="trial"?"체험 중":status==="active"?"정상 이용":status==="past_due"?"결제 대기":status==="suspended"?"이용 정지":status||"확인 필요";}
function daysLeft(date){if(!date)return null;return Math.max(0,Math.ceil((new Date(date)-new Date())/86400000));}
function dateText(date){return date?new Date(date).toLocaleDateString("ko-KR"):"-";}

export default function SuperAdminPage(){
  const[loading,setLoading]=useState(true),[allowed,setAllowed]=useState(false),[rows,setRows]=useState([]),[message,setMessage]=useState("");
  const[selected,setSelected]=useState(null),[customDays,setCustomDays]=useState(""),[reason,setReason]=useState(""),[busy,setBusy]=useState(false),[history,setHistory]=useState([]),[historyLoading,setHistoryLoading]=useState(false);

  async function loadRows(){const s=createClient();const{data,error}=await s.rpc("super_admin_restaurants");if(error)setMessage(error.message||"식당 목록을 불러오지 못했습니다.");else setRows(data||[]);}

  useEffect(()=>{(async()=>{const s=createClient();const{data:{user}}=await s.auth.getUser();if(!user){location.replace("/login");return;}const{data:isAdmin,error:adminError}=await s.rpc("is_super_admin");if(adminError){setMessage("슈퍼관리자 데이터베이스 설정이 필요합니다.");setLoading(false);return;}if(!isAdmin){setAllowed(false);setLoading(false);return;}setAllowed(true);await loadRows();setLoading(false);})();},[]);

  async function openTrial(r){setSelected(r);setCustomDays("");setReason("");setHistory([]);setHistoryLoading(true);const s=createClient();const{data,error}=await s.rpc("super_admin_trial_history",{p_restaurant_id:r.id});if(!error)setHistory(data||[]);setHistoryLoading(false);}
  async function extendTrial(days){const n=Number(days);if(!Number.isInteger(n)||n<1){setMessage("연장 일수를 확인해 주세요.");return;}setBusy(true);setMessage("");const s=createClient();const{data,error}=await s.rpc("super_admin_extend_trial",{p_restaurant_id:selected.id,p_days:n,p_reason:reason.trim()||null});if(error)setMessage(error.message||"체험기간 연장 중 오류가 발생했습니다.");else{setMessage(`${selected.name} 무료체험을 ${n}일 연장했습니다.`);await loadRows();const{data:h}=await s.rpc("super_admin_trial_history",{p_restaurant_id:selected.id});setHistory(h||[]);setSelected(prev=>prev?{...prev,trial_ends_at:data}:prev);setCustomDays("");setReason("");}setBusy(false);}

  const totals=useMemo(()=>({all:rows.length,trial:rows.filter(r=>r.subscription_status==="trial").length,active:rows.filter(r=>r.subscription_status==="active").length,issue:rows.filter(r=>["past_due","suspended"].includes(r.subscription_status)).length}),[rows]);

  if(loading)return <main className="center-shell"><div className="form-card"><p className="helper">운영자 화면을 불러오는 중...</p></div></main>;
  if(!allowed)return <main className="center-shell"><div className="form-card"><h1>접근 권한이 없습니다</h1><p className="helper">한끼장부 운영자 계정만 사용할 수 있는 화면입니다.</p>{message&&<p className="error">{message}</p>}<a className="btn secondary" href="/dashboard">식당 관리 화면으로</a></div></main>;

  return <main className="super-admin-shell">
    <header className="super-admin-topbar"><div><span>한끼장부 운영자</span><h1>서비스 관리</h1><p>가입 식당과 이용 상태를 한눈에 확인합니다.</p></div><a className="btn secondary" href="/dashboard">식당 화면</a></header>
    {message&&<div className={message.includes("오류")||message.includes("확인")?"settings-message error":"settings-message"}>{message}</div>}
    <section className="super-admin-cards"><article><span>전체 식당</span><strong>{totals.all}곳</strong></article><article><span>체험 중</span><strong>{totals.trial}곳</strong></article><article><span>정상 이용</span><strong>{totals.active}곳</strong></article><article><span>확인 필요</span><strong>{totals.issue}곳</strong></article></section>
    <section className="super-admin-panel"><div className="section-head"><div><h2>가입 식당</h2><p>가입일, 무료체험 기간과 현재 이용 상태입니다.</p></div></div><div className="super-admin-table-wrap"><table className="super-admin-table"><thead><tr><th>식당</th><th>대표자</th><th>가입일</th><th>무료체험</th><th>거래처</th><th>상태</th><th>관리</th></tr></thead><tbody>
      {rows.map(r=>{const left=daysLeft(r.trial_ends_at);return <tr key={r.id}><td><strong>{r.name}</strong><small>{r.phone||r.email||"연락처 미등록"}</small></td><td>{r.owner_name||"-"}</td><td>{dateText(r.created_at)}</td><td>{r.subscription_status==="trial"?<><strong>{left??0}일 남음</strong><small>{dateText(r.trial_ends_at)}까지</small></>:dateText(r.trial_ends_at)}</td><td>{r.company_count||0}곳</td><td><span className={`admin-status ${r.subscription_status||"trial"}`}>{statusLabel(r.subscription_status)}</span></td><td><button className="admin-manage-btn" onClick={()=>openTrial(r)}>체험기간 관리</button></td></tr>})}
      {!rows.length&&<tr><td colSpan="7" className="admin-empty">등록된 식당이 없습니다.</td></tr>}
    </tbody></table></div></section>

    {selected&&<div className="modal-backdrop" onMouseDown={()=>!busy&&setSelected(null)}><section className="trial-admin-modal" onMouseDown={e=>e.stopPropagation()}><div className="trial-modal-head"><div><span>무료체험 관리</span><h2>{selected.name}</h2><p>현재 종료일 {dateText(selected.trial_ends_at)} · {daysLeft(selected.trial_ends_at)??0}일 남음</p></div><button type="button" onClick={()=>setSelected(null)} disabled={busy}>✕</button></div>
      <div className="trial-quick-buttons"><button onClick={()=>extendTrial(7)} disabled={busy}>+7일</button><button onClick={()=>extendTrial(15)} disabled={busy}>+15일</button><button onClick={()=>extendTrial(30)} disabled={busy}>+30일</button></div>
      <label>연장 사유<input value={reason} onChange={e=>setReason(e.target.value)} placeholder="예: 초기 설치 지원, 서비스 보상"/></label>
      <div className="trial-custom-row"><label>직접 입력<input type="number" min="1" max="3650" value={customDays} onChange={e=>setCustomDays(e.target.value)} placeholder="일수"/></label><button className="btn primary" onClick={()=>extendTrial(customDays)} disabled={busy||!customDays}>{busy?"처리 중...":"연장 적용"}</button></div>
      <div className="trial-history"><h3>연장 이력</h3>{historyLoading?<p>불러오는 중...</p>:history.length?history.map(h=><article key={h.id}><div><strong>+{h.added_days}일</strong><span>{dateText(h.created_at)}</span></div><p>{dateText(h.previous_trial_ends_at)} → {dateText(h.new_trial_ends_at)}</p>{h.reason&&<small>{h.reason}</small>}</article>):<p>아직 연장 이력이 없습니다.</p>}</div>
    </section></div>}
  </main>;
}
