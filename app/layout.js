import "./globals.css";

export const metadata = {
  title: "한끼장부",
  description: "공단 한식뷔페 식수·정산 관리",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
