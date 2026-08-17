import { ImageResponse } from "next/og";
import { isLocale } from "@/lib/i18n";

export const alt = "Ataberk Soylu — Creative Technologist & Multi Designer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tr = isLocale(locale) ? locale === "tr" : true;

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          background: "#0a0a0b",
          color: "#f3efe7",
          padding: "68px 72px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "radial-gradient(circle at 78% 42%, rgba(200,255,62,.16), transparent 22%), radial-gradient(circle at 70% 54%, rgba(138,230,255,.09), transparent 34%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 54,
            top: 44,
            display: "flex",
            width: 470,
            height: 470,
            borderRadius: 999,
            border: "1px solid rgba(243,239,231,.12)",
            boxShadow: "0 0 110px rgba(200,255,62,.09) inset",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 18, letterSpacing: 5, color: "#c8ff3e" }}>
            CREATIVE TECHNOLOGIST · MULTI DESIGNER
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 104, lineHeight: 0.86, fontWeight: 700, letterSpacing: -6 }}>
              ATABERK
            </div>
            <div style={{ display: "flex", fontSize: 104, lineHeight: 0.92, fontWeight: 700, letterSpacing: -6 }}>
              SOYLU
            </div>
          </div>
          <div style={{ display: "flex", maxWidth: 710, fontSize: 24, lineHeight: 1.35, color: "#b9b5ac" }}>
            {tr
              ? "Yapay zekâ, motion, 3D ve web arasında akıllı dijital deneyimler."
              : "Intelligent digital experiences across AI, motion, 3D and the web."}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            right: 76,
            bottom: 64,
            display: "flex",
            color: "rgba(243,239,231,.38)",
            fontSize: 16,
            letterSpacing: 6,
          }}
        >
          01&lt;&gt;{"{}"}/+*
        </div>
      </div>
    ),
    size,
  );
}
