import { ImageResponse } from "next/og";

// Imagem que aparece quando o link do site é compartilhado (WhatsApp, Instagram...)
export const alt = "MIF BRECHO - peças com história e muito carinho";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #F8BBD9 0%, #FCE4EC 60%, #FFF5F8 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 140,
            fontWeight: 700,
            letterSpacing: 4,
            color: "#C2185B",
          }}
        >
          MIF BRECHO
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 48,
            color: "#4A148C",
          }}
        >
          Peças com história e muito carinho
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 44,
            fontSize: 34,
            color: "#7B1FA2",
          }}
        >
          www.mifbrecho.com.br
        </div>
      </div>
    ),
    { ...size }
  );
}
