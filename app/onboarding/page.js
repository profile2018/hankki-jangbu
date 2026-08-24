"use client";

import { useState } from "react";
import { createClient } from "../../lib/supabase/client";

export default function OnboardingPage() {
  const [form, setForm] = useState({ restaurantName:"", ownerName:"", phone:"", adminPin:"", lunchPrice:"9000", dinnerPrice:"9000" });
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!/^\d{4}$/.test(form.adminPin)) return setMessage("관리자 PIN은 숫자 4자리로 입력해 주세요.");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setMessage("로그인이 필요합니다.");

    const { data: restaurant, error } = await supabase.from("restaurants").insert({
      name: form.restaurantName,
      owner_name: form.ownerName,
      phone: form.phone,
      admin_pin: form.adminPin,
      default_lunch_price: Number(form.lunchPrice),
      default_dinner_price: Number(form.dinnerPrice),
      trial_started_at: new Date().toISOString(),
      trial_ends_at: new Date(Date.now() + 30*24*60*60*1000).toISOString()
    }).select("id").single();
    if (error) return setMessage(error.message);

    const { error: memberError } = await supabase.from("restaurant_members").insert({ restaurant_id: restaurant.id, user_id: user.id, role: "owner" });
    if (memberError) return setMessage(memberError.message);
    window.location.href = "/dashboard";
  }

  return (
    <main className="center-shell">
      <form className="form-card wide" onSubmit={handleSubmit}>
        <h1>식당 기본정보 등록</h1>
        <div className="grid2">
          <label>식당명<input value={form.restaurantName} onChange={(e)=>setForm({...form,restaurantName:e.target.value})} required /></label>
          <label>대표자명<input value={form.ownerName} onChange={(e)=>setForm({...form,ownerName:e.target.value})} required /></label>
          <label>연락처<input value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} required /></label>
          <label>관리자 PIN 4자리<input inputMode="numeric" maxLength="4" value={form.adminPin} onChange={(e)=>setForm({...form,adminPin:e.target.value.replace(/\D/g,"")})} required /></label>
          <label>기본 중식 단가<input type="number" min="0" value={form.lunchPrice} onChange={(e)=>setForm({...form,lunchPrice:e.target.value})} /></label>
          <label>기본 석식 단가<input type="number" min="0" value={form.dinnerPrice} onChange={(e)=>setForm({...form,dinnerPrice:e.target.value})} /></label>
        </div>
        {message && <p className="error">{message}</p>}
        <button className="btn primary">식당 등록하고 시작하기</button>
      </form>
    </main>
  );
}
