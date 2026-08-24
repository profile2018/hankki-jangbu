# 한끼장부

공단 한식뷔페의 식수 등록, 거래처별 월말 정산, 매입 관리를 위한 SaaS 프로젝트.

## 현재 구현 범위 (2단계 시작)
- 서비스 시작 화면
- 이메일 회원가입 / 로그인 UI
- 최초 식당 등록 UI
- 사장님 대시보드 골격
- Supabase 기본 스키마 및 RLS 초안
- 거래처별 PIN / 관리자 PIN 데이터 필드
- 향후 월말 정산 이메일 발송을 위한 거래처 담당자 이메일 필드

## 연결 방법
1. Supabase 프로젝트 생성
2. `.env.example`을 `.env.local`로 복사하고 URL / Publishable Key 입력
3. `supabase/migrations/001_initial_schema.sql`을 Supabase SQL Editor에서 검토 후 실행
4. `npm install`
5. `npm run dev`

주의: 실제 서비스 전 PIN은 평문 저장 대신 별도 검증 로직/해시 처리로 강화할 예정입니다. 1차 골격 단계에서는 화면 흐름과 데이터 관계를 우선 고정합니다.
