import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Under Recovery — Liberalis-Tracker",
  description: "The system is temporarily unavailable while we recover data.",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "radial-gradient(1200px 600px at 50% -10%, #1e3a8a33, transparent), #0b1020",
        color: "#eef2ff",
        fontFamily: "var(--font-nunito), system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 640,
          textAlign: "center",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 20,
          padding: "48px 36px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            margin: "0 auto 20px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f59e0b22",
            border: "1px solid #f59e0b55",
            fontSize: 34,
          }}
          role="img"
          aria-label="Warning"
        >
          ⚠️
        </div>

        <p
          style={{
            display: "inline-block",
            fontSize: 12,
            letterSpacing: 2,
            fontWeight: 800,
            color: "#fbbf24",
            background: "#f59e0b1a",
            border: "1px solid #f59e0b44",
            padding: "6px 14px",
            borderRadius: 999,
            margin: 0,
            marginBottom: 16,
          }}
        >
          SYSTEM NOTICE
        </p>

        <h1 style={{ fontSize: 32, lineHeight: 1.2, margin: "0 0 12px", fontWeight: 900 }}>
          System is Down for Data Recovery
        </h1>

        <p style={{ fontSize: 17, lineHeight: 1.6, color: "#c7d2fe", margin: "0 0 12px" }}>
          The system is currently <strong style={{ color: "#fff" }}>under recovering the data because of data loss</strong>.
        </p>

        <p style={{ fontSize: 15, lineHeight: 1.7, color: "#a5b4fc", margin: "0 0 24px" }}>
          Students and Admins cannot access the system right now. Please do not attempt to log in,
          register, or submit any transactions until recovery is complete. Your data is being restored
          and no further action is needed from you.
        </p>

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
            fontSize: 13,
            color: "#93a0d8",
          }}
        >
          <span style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 14px" }}>
            🔒 All logins disabled
          </span>
          <span style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 14px" }}>
            🛠️ Recovery in progress
          </span>
        </div>

        <p style={{ marginTop: 28, fontSize: 13, color: "#7c8bd4" }}>
          Please check back later. Thank you for your patience and understanding.
        </p>
      </div>
    </main>
  );
}
