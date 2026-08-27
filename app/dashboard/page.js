"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

export default function DashboardPage() {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.replace("/login");
        return;
      }

      const { data: membership } = await supabase
        .from("restaurant_members")
        .select("restaurant_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!membership?.restaurant_id) {
        window.location.replace("/onboarding");
        return;
      }

      const { data } = await supabase
        .from("restaurants")
        .select("id,name,trial_started_at,trial_ends_at")
        .eq("id", membership.restaurant_id)
        .single();

      if (active) {
        setRestaurant(data || null);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.replace("/");
  }

  if (loading) return <main className="center-shell"><div className="form-card"><p className="helper">식당 정보를 불러오고 있습니다...</p></div></main>;

  const now = new Date();
  const end = restaurant?.trial_ends_at ? new Date(restaurant.trial_ends_at) : null;
  const trialDays = end ? Math.max(0, Math.ceil((end - now) / (24 * 60 * 60 * 1000))) : 0;

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div><strong>한끼장부</strong><span>{restaurant?.name || "사장님 관리"}</span></div>
        <button onClick={logout}>로그아웃</button>
      </header>
      <section className="hero">
        <p>오늘 현황</p>
        <h1>식수 관리 준비 완료</h1>
        <p>다음 단계에서 거래처 등록과 식수 입력 화면을 연결합니다.</p>
      </section>
      <section className="cards">
        <article><span>오늘 중식</span><strong>0명</strong></article>
        <article><span>오늘 석식</span><strong>0명</strong></article>
        <article><span>등록 거래처</span><strong>0곳</strong></article>
        <article><span>무료체험</span><strong>{trialDays}일</strong></article>
      </section>
    </main>
  );
}
