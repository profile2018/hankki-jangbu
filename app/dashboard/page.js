export default function DashboardPage() {
  return (
    <main className="dashboard-shell">
      <header className="topbar"><div><strong>한끼장부</strong><span>사장님 관리</span></div><button>로그아웃</button></header>
      <section className="hero"><p>오늘 현황</p><h1>식수 관리 준비 완료</h1><p>다음 단계에서 거래처 등록과 식수 입력 화면을 연결합니다.</p></section>
      <section className="cards">
        <article><span>오늘 중식</span><strong>0명</strong></article>
        <article><span>오늘 석식</span><strong>0명</strong></article>
        <article><span>등록 거래처</span><strong>0곳</strong></article>
        <article><span>무료체험</span><strong>30일</strong></article>
      </section>
    </main>
  );
}
