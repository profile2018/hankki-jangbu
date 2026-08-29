"use client";

import {useEffect,useState} from "react";
import {createClient} from "../../lib/supabase/client";

const emptySettings={
  name:"",owner_name:"",phone:"",business_number:"",address:"",email:"",
  bank_name:"",bank_account:"",bank_holder:"",
  default_lunch_price:"",default_dinner_price:"",
  kiosk_reset_seconds:"3",kiosk_default_meal:"lunch"
};

export default function SettingsPage(){
  const[loading,setLoading]=useState(true);
  const[saving,setSaving]=useState(false);
  const[message,setMessage]=useState("");
  const[restaurantId,setRestaurantId]=useState("");
  const[userEmail,setUserEmail]=useState("");
  const[role,setRole]=useState("");
  const[form,setForm]=useState(emptySettings);

  useEffect(()=>{(async()=>{
    const s=createClient();
    const{data:{user}}=await s.auth.getUser();
    if(!user){location.replace("/login");return;}
    setUserEmail(user.email||"");
    const{data:m,error:memberError}=await s.from("restaurant_members").select("restaurant_id,role").eq("user_id",user.id).limit(1).maybeSingle();
    if(memberError||!m?.restaurant_id){location.replace("/onboarding");return;}
    setRestaurantId(m.restaurant_id);setRole(m.role||"");
    const{data:r,error}=await s.from("restaurants").select("id,name,owner_name,phone,business_number,address,email,bank_name,bank_account,bank_holder,default_lunch_price,default_dinner_price,kiosk_reset_seconds,kiosk_default_meal").eq("id",m.restaurant_id).single();
    if(error){setMessage("설정용 데이터베이스 업데이트가 필요합니다.");setLoading(false);return;}
    setForm({
      name:r.name||"",owner_name:r.owner_name||"",phone:r.phone||"",business_number:r.business_number||"",address:r.address||"",email:r.email||"",
      bank_name:r.bank_name||"",bank_account:r.bank_account||"",bank_holder:r.bank_holder||"",
      default_lunch_price:String(r.default_lunch_price??0),default_dinner_price:String(r.default_dinner_price??0),
      kiosk_reset_seconds:String(r.kiosk_reset_seconds??3),kiosk_default_meal:r.kiosk_default_meal||"lunch"
    });
    setLoading(false);
  })();},[]);

  function change(e){const{name,value}=e.target;setForm(prev=>({...prev,[name]:value}));}

  async function save(e){
    e.preventDefault();setMessage("");setSaving(true);
    const s=createClient();
    const{error}=await s.rpc("update_restaurant_settings",{
      p_restaurant_id:restaurantId,p_name:form.name,p_owner_name:form.owner_name,p_phone:form.phone,
      p_business_number:form.business_number,p_address:form.address,p_email:form.email,
      p_bank_name:form.bank_name,p_bank_account:form.bank_account,p_bank_holder:form.bank_holder,
      p_default_lunch_price:Number(form.default_lunch_price||0),p_default_dinner_price:Number(form.default_dinner_price||0),
      p_kiosk_reset_seconds:Number(form.kiosk_reset_seconds),p_kiosk_default_meal:form.kiosk_default_meal
    });
    if(error)setMessage(error.message||"설정 저장 중 오류가 발생했습니다.");
    else setMessage("설정을 저장했습니다.");
    setSaving(false);
  }

  if(loading)return <main className="center-shell"><div className="form-card"><p className="helper">설정을 불러오는 중...</p></div></main>;

  return <main className="settings-shell">
    <header className="settings-topbar">
      <div><span>한끼장부</span><h1>설정</h1><p>식당 운영과 정산에 필요한 기본 정보를 관리합니다.</p></div>
      <a className="btn secondary" href="/dashboard">홈으로</a>
    </header>

    {message&&<div className={message.includes("오류")||message.includes("필요")?"settings-message error":"settings-message"}>{message}</div>}

    <form onSubmit={save} className="settings-form">
      <section className="settings-card">
        <div className="settings-card-head"><div className="settings-icon">👤</div><div><h2>계정 관리</h2><p>현재 로그인된 관리자 계정입니다.</p></div></div>
        <div className="settings-grid two"><label>로그인 이메일<input value={userEmail} readOnly/></label><label>권한<input value={role==="owner"?"식당 대표 관리자":role==="manager"?"관리자":role} readOnly/></label></div>
        <small className="settings-note">비밀번호 변경 기능은 계정 보안 메뉴를 추가할 때 연결합니다.</small>
      </section>

      <section className="settings-card">
        <div className="settings-card-head"><div className="settings-icon">🏪</div><div><h2>식당 정보</h2><p>정산서와 운영 화면에 표시될 식당 기본정보입니다.</p></div></div>
        <div className="settings-grid two"><label>식당명 *<input name="name" value={form.name} onChange={change} required/></label><label>대표자명 *<input name="owner_name" value={form.owner_name} onChange={change} required/></label></div>
        <div className="settings-grid two"><label>사업자등록번호<input name="business_number" value={form.business_number} onChange={change} placeholder="000-00-00000"/></label><label>전화번호<input name="phone" value={form.phone} onChange={change} placeholder="031-000-0000"/></label></div>
        <label>사업장 주소<input name="address" value={form.address} onChange={change} placeholder="식당 주소"/></label>
        <label>대표 이메일<input name="email" type="email" value={form.email} onChange={change} placeholder="restaurant@example.com"/></label>
        <div className="settings-grid two"><label>기본 중식 단가<input name="default_lunch_price" type="number" min="0" value={form.default_lunch_price} onChange={change}/></label><label>기본 석식 단가<input name="default_dinner_price" type="number" min="0" value={form.default_dinner_price} onChange={change}/></label></div>
      </section>

      <section className="settings-card">
        <div className="settings-card-head"><div className="settings-icon">🏦</div><div><h2>입금계좌</h2><p>업체에 보내는 식대 정산서에 사용할 계좌정보입니다.</p></div></div>
        <div className="settings-grid three"><label>은행명<input name="bank_name" value={form.bank_name} onChange={change} placeholder="예: 국민은행"/></label><label>계좌번호<input name="bank_account" value={form.bank_account} onChange={change} placeholder="000000-00-000000"/></label><label>예금주<input name="bank_holder" value={form.bank_holder} onChange={change}/></label></div>
      </section>

      <section className="settings-card">
        <div className="settings-card-head"><div className="settings-icon">🖥️</div><div><h2>키오스크 설정</h2><p>식수 등록 후 화면 동작에 사용할 기본 설정입니다.</p></div></div>
        <div className="settings-grid two"><label>등록 후 초기화 시간<select name="kiosk_reset_seconds" value={form.kiosk_reset_seconds} onChange={change}><option value="2">2초</option><option value="3">3초</option><option value="5">5초</option></select></label><label>기본 식사 유형<select name="kiosk_default_meal" value={form.kiosk_default_meal} onChange={change}><option value="lunch">중식</option><option value="dinner">석식</option></select></label></div>
        <small className="settings-note">키오스크 실제 화면 적용은 다음 키오스크 최종 점검 단계에서 연결합니다.</small>
      </section>

      <div className="settings-savebar"><a className="btn secondary" href="/dashboard">취소</a><button className="btn primary" disabled={saving}>{saving?"저장 중...":"설정 저장"}</button></div>
    </form>
  </main>;
}
