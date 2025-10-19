import { ImageResponse } from "next/og";

export const runtime = "edge";

const WIDTH = 1200;
const HEIGHT = 630;

function formatScoreDelta(value?: string | null): string {
  if (!value) return "±0";
  const num = Number.parseInt(value, 10);
  if (!Number.isFinite(num) || Number.isNaN(num)) return value;
  if (num === 0) return "±0";
  return num > 0 ? `+${num}` : `${num}`;
}

function formatRank(value?: string | null): string {
  if (!value) return "Unranked";
  const num = Number.parseInt(value, 10);
  if (!Number.isFinite(num) || Number.isNaN(num)) return value;
  return `#${num}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const outcome = searchParams.get("outcome") === "win" ? "win" : "loss";
  const scoreDelta = formatScoreDelta(searchParams.get("score_delta"));
  const scoreTotal = searchParams.get("score_total") ?? "0";
  const rank = formatRank(searchParams.get("rank"));
  const word = (searchParams.get("word") ?? "").toUpperCase();
  const domain = searchParams.get("domain") ? searchParams.get("domain")!.toUpperCase() : "";
  const handle = searchParams.get("handle") ?? "@anon";
  const wins = searchParams.get("wins") ?? "0";
  const losses = searchParams.get("losses") ?? "0";
  const streak = searchParams.get("streak") ?? "0";

  const heroTitle = outcome === "win" ? "Majnu Bhai was saved today" : "Majnu Bhai fell today";
  const heroSub = outcome === "win" ? `by ${handle}` : `by ${handle} — the don waits.`;
  const gradient = outcome === "win"
    ? "linear-gradient(135deg, #FFE5E0 0%, #E03C31 55%, #A0181A 100%)"
    : "linear-gradient(135deg, #2E0B0B 0%, #5C1B1B 55%, #120303 100%)";
  const panelBg = outcome === "win" ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 234, 232, 0.2)";
  const textColor = outcome === "win" ? "#1C0B0A" : "#FFE5E0";
  const accentColor = outcome === "win" ? "#FFE5E0" : "#E03C31";
  const emoji = outcome === "win" ? "😎" : "💀";

  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px 80px",
          backgroundImage: gradient,
          color: textColor,
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: 6, textTransform: "uppercase" }}>{heroTitle}</div>
            <div style={{ fontSize: 28, letterSpacing: 3, textTransform: "uppercase", color: accentColor }}>{heroSub}</div>
            <div style={{ fontSize: 20, letterSpacing: 4, textTransform: "uppercase" }}>
              Wins +3 | Losses –1 | Streak bonus × each save
            </div>
          </div>
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: panelBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 80,
            }}
          >
            {emoji}
          </div>
        </div>

        <div style={{ display: "flex", gap: 40 }}>
          <div
            style={{
              flex: 1,
              background: panelBg,
              borderRadius: 28,
              padding: "32px 40px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                fontSize: 18,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: accentColor,
              }}
            >
              Word Revealed
            </div>
            <div style={{ fontSize: 54, fontWeight: 800, letterSpacing: 6 }}>{word || "????"}</div>
            <div style={{ fontSize: 20, textTransform: "uppercase", letterSpacing: 4 }}>{domain}</div>
          </div>
          <div
            style={{
              width: 280,
              background: panelBg,
              borderRadius: 28,
              padding: "32px 36px",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div>
              <div style={{ fontSize: 16, textTransform: "uppercase", letterSpacing: 4 }}>Score Delta</div>
              <div style={{ fontSize: 40, fontWeight: 700 }}>{scoreDelta}</div>
            </div>
            <div>
              <div style={{ fontSize: 16, textTransform: "uppercase", letterSpacing: 4 }}>Total Score</div>
              <div style={{ fontSize: 36, fontWeight: 600 }}>{scoreTotal}</div>
            </div>
            <div>
              <div style={{ fontSize: 16, textTransform: "uppercase", letterSpacing: 4 }}>Rank</div>
              <div style={{ fontSize: 36, fontWeight: 600 }}>{rank}</div>
            </div>
            <div style={{ height: 1, background: "rgba(255,255,255,0.25)", margin: "12px 0" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 18 }}>
              <span>Wins {wins}</span>
              <span>Losses {losses}</span>
              <span>Streak {streak}</span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 20,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          <span>SaveMajnu.live</span>
          <span style={{ fontSize: 18, letterSpacing: 2 }}>Hangman but the don is watching.</span>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
    },
  );
}
