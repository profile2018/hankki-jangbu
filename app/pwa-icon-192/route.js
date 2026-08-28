import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "192px",
          height: "192px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b2f5b",
          borderRadius: "42px",
          color: "white",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", fontSize: "62px", lineHeight: 1 }}>🍚</div>
        <div style={{ display: "flex", marginTop: "4px", fontSize: "32px", fontWeight: 800 }}>
          한끼<span style={{ color: "#f5a623" }}>장부</span>
        </div>
        <div style={{ display: "flex", marginTop: "4px", fontSize: "12px", opacity: 0.9 }}>
          식수 관리 · 정산
        </div>
      </div>
    ),
    { width: 192, height: 192 }
  );
}
