import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "180px",
          height: "180px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b2f5b",
          borderRadius: "40px",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: "58px", lineHeight: 1 }}>🍚</div>
        <div style={{ display: "flex", marginTop: "4px", fontSize: "30px", fontWeight: 800 }}>
          한끼<span style={{ color: "#f5a623" }}>장부</span>
        </div>
      </div>
    ),
    size
  );
}
