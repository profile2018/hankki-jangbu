import "./globals.css";
import "./settlement-extra.css";
import "./modal-scroll-fix.css";
import "./kiosk-keypad.css";
import "./update-notice.css";
import "./settings-extra.css";
import "./mobile-dashboard.css";
import UpdateNotice from "./UpdateNotice";
import SettingsShortcut from "./SettingsShortcut";
import MobileDashboardNav from "./MobileDashboardNav";

export const metadata = {
  title: "한끼장부",
  description: "공단 한식뷔페 식수·정산 관리",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "한끼장부",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192", sizes: "192x192", type: "image/png" },
      { url: "/icon-512", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icon.svg",
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport = {
  themeColor: "#0b2f5b",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon?v=3" />
        <link rel="manifest" href="/manifest.webmanifest?v=3" />
      </head>
      <body>
        {children}
        <SettingsShortcut />
        <MobileDashboardNav />
        <UpdateNotice />
      </body>
    </html>
  );
}
