"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

async function hashPin(userId, pin) {
  const bytes = new TextEncoder().encode(`${userId}:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function OnboardingPage() {
  const [form, setForm] = useState({ restaurantName: "", ownerName: "", phone: "", adminPin: "", lunchPrice: "9000", dinnerPrice: "9000" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.replace("/login");
        return;
      }
      const { data } = await supabase.from("restaurant_members").select("restaurant_id").eq("user_id", user.id).limit(1);
      if (data?.length) {
        window.location.replace("/dashboard");
        return;
      }
      if (active) setChecking(false);
    })();
    return () => { active = false; };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!/^\d{4}$/.test(form.adminPin)) return setMessage("관리자 PIN은 숫자 4자리로 입력해 주세요.");
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("로그인이 필요합니다.");

      const { data: existing } = await supabase.from("restaurant_members").select("restaurant_id").eq("user_id", user.id).limit(1);
      if (existing?.length) {
        window.location.replace("/dashboard");
        return;
      }

      const startedAt = new Date();
      const endsAt = new Date(startedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
      const pinHash = await hashPin(user.id, form.adminPin);

      const { data: restaurant, error } = await supabase.from("restaurants").insert({
        owner_user_id: user.id,
        name: form.restaurantName.trim(),
        owner_name: form.ownerName.trim(),
        phone: form.phone.trim(),
        admin_pin_hash: pinHash,
        default_lunch_price: Number(form.lunchPrice || 0),
        default_dinner_price: Number(form.dinnerPrice || 0),
        trial_started_at: startedAt.toISOString(),
        trial_ends_at: endsAt.toISOString(),
        subscription_status: "trial"
      }).select("id").single();
      if (error) throw error;

      const { error: memberError } = await supabase.from("restaurant_members").insert({
        restaurant_id: restaurant.id,
        user_id: user.id,
        role: "owner"
      });
      if (memberError) throw memberError;

      const { error: subscriptionError } = await supabase.from("subscriptions").insert({
        restaurant_id: restaurant.id,
        plan_code: "basic",
        status: "trial",
        trial_started_at: startedAt.toISOString(),
        trial_ends_at: endsAt.toISOString()
      });
      if (subscriptionError) throw subscriptionError;

      window.location.replace("/dashboard");
    } catch (error) {
      setMessage(error.message || "식당 등록에 실패했습니다.");
      setLoading(false);
    }
  }

  if (checking) return <main className="center-shell"><div className="form-card"><p className="helper">가입 정보를 확인하고 있습니다...</p></div></main>;

  return (
    <main className="onboarding-shell">
      <section className="onboarding-head">
        <div className="mini-brand">한끼</div>
        <div><strong>한끼장부</strong><span>식당 기본 정보 등록</span></div>
        <div className="steps"><b>1</b><span>식당 정보</span><i>2</i><span>거래처 등록</span><i>3</i><span>운영 시작</span></div>
      </section>

      <form className="form-card onboarding-card" onSubmit={handleSubmit}>
        <div className="form-title"><div><p>처음 한 번만 등록하면 됩니다</p><h1>식당 기본 정보 등록</h1><span>월말 식수 집계와 정산에 사용할 기본 정보를 입력해 주세요.</span></div><div className="safe-note">🔒 사장님 관리 정보</div></div>
        <div className="grid2">
          <label>식당명 *<input value={form.restaurantName} onChange={(e) => setForm({...form, restaurantName:e.target.value})} placeholder="예) 행복한식뷔페" required /></label>
          <label>대표자명 *<input value={form.ownerName} onChange={(e) => setForm({...form, ownerName:e.target.value})} placeholder="대표자명을 입력하세요" required /></label>
          <label>연락처 *<input value={form.phone} onChange={(e) => setForm({...form, phone:e.target.value})} placeholder="예) 010-1234-5678" required /></label>
          <label>관리자 PIN 4자리 *<input inputMode="numeric" maxLength="4" value={form.adminPin} onChange={(e) => setForm({...form, adminPin:e.target.value.replace(/\D/g, "")})} placeholder="숫자 4자리" required /></label>
          <label>기본 중식 단가<input type="number" min="0" step="100" value={form.lunchPrice} onChange={(e) => setForm({...form, lunchPrice:e.target.value})} /></label>
          <label>기본 석식 단가<input type="number" min="0" step="100" value={form.dinnerPrice} onChange={(e) => setForm({...form, dinnerPrice:e.target.value})} /></label>
        </div>
        <div className="trial-info"><strong>30일 무료체험</strong><span>이 정보를 저장하는 시점부터 무료체험이 시작됩니다.</span></div>
        {message && <p className="error">{message}</p>}
        <button className="btn primary" disabled={loading}>{loading ? "식당을 등록하고 있습니다..." : "식당 등록하고 시작하기"}</button>
      </form>
    </main>
  );
}
