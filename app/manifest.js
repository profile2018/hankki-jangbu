export default function manifest() {
  return {
    name: "한끼장부",
    short_name: "한끼장부",
    description: "공단 한식뷔페 식수·정산 관리",
    start_url: "/",
    display: "standalone",
    background_color: "#0b2f5b",
    theme_color: "#0b2f5b",
    lang: "ko",
    icons: [
      {
        src: "/pwa-icon-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/pwa-icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}
