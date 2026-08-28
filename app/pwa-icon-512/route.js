import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "512px",
          height: "512px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b2f5b",
          borderRadius: "112px",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: "170px", lineHeight: 1 }}>🍚</div>
        <div style={{ display: "flex", marginTop: "10px", fontSize: "86px", fontWeight: 800 }}>
          한끼<span style={{ color: "#f5a623" }}>장부</span>
        </div>
        <div style={{ display: "flex", marginTop: "10px", fontSize: "30px", opacity: 0.9 }}>
          식수 관리 · 정산 · 매출 분석
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
