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
  const domain = searchParams.get("domain")
    ? searchParams.get("domain")!.toUpperCase()
    : "";

  const background = outcome === "win" ? "#34D399" : "#F87171";
  const headline = outcome === "win" ? "Majnu Survived" : "Majnu is Dead";
  const subline =
    outcome === "win"
      ? "Rope slipped. Score climbs."
      : "The knot tightened. Score dropped.";

  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 80px",
          background,
          color: outcome === "win" ? "#0B1F17" : "#330000",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div
              style={{
                fontSize: 36,
                fontWeight: 800,
                letterSpacing: 6,
                textTransform: "uppercase",
              }}
            >
              {headline}
            </div>
            <div style={{ fontSize: 22, marginTop: 12 }}>{subline}</div>
          </div>
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: outcome === "win" ? "#F0FFF4" : "#200000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 80,
            }}
          >
            {outcome === "win" ? "😎" : "💀"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 40 }}>
          <div
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.2)",
              borderRadius: 28,
              padding: "32px 36px",
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
                color: outcome === "win" ? "#0B1F17" : "#330000",
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
              background: "rgba(255,255,255,0.2)",
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
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 20,
          }}
        >
          <span style={{ textTransform: "uppercase", letterSpacing: 6 }}>saveMajnu.live</span>
          <span style={{ fontSize: 18 }}>Hangman but the don is watching.</span>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
    },
  );
}

