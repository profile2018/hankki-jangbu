import "./globals.css";

export const metadata = {
  title: "한끼장부",
  description: "공단 한식뷔페 식수·정산 관리",
  applicationName: "한끼장부",
  manifest: "/manifest.webmanifest",
  themeColor: "#0b2f5b",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
};

export const viewport = {
  themeColor: "#0b2f5b",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
