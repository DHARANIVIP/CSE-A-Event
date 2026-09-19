import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Mystery Box – The Digital Case";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
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
          backgroundColor: "#FFF4E0",
          border: "16px solid #B9573F",
          position: "relative",
          fontFamily: "monospace",
        }}
      >
        {/* Decorative brick stripe at top & bottom */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 24,
            backgroundColor: "#B9573F",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 24,
            backgroundColor: "#B9573F",
          }}
        />

        {/* Detective Hat Vector Icon */}
        <svg width="120" height="90" viewBox="0 0 64 48">
          <path
            d="M6 38 C6 34, 18 32, 32 32 C46 32, 58 34, 58 38 C58 41, 46 43, 32 43 C18 43, 6 41, 6 38 Z"
            fill="#0B0B0B"
          />
          <path
            d="M18 32 C17 22, 20 12, 28 11 C31 13, 33 13, 36 11 C44 12, 47 22, 46 32 Z"
            fill="#0B0B0B"
          />
          <path
            d="M18 30 C21 31, 43 31, 46 30 L45.5 26 C43 27, 21 27, 18.5 26 Z"
            fill="#B30033"
          />
        </svg>

        {/* Big Crimson Block Letter Title */}
        <div
          style={{
            fontSize: 82,
            fontWeight: 900,
            color: "#B30033",
            letterSpacing: "-2px",
            textTransform: "uppercase",
            marginTop: 10,
            textShadow: "6px 6px 0px #1EB0D8",
          }}
        >
          MYSTERY BOX
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 34,
            fontStyle: "italic",
            color: "#0B0B0B",
            marginTop: 16,
            borderBottom: "4px solid #B30033",
            paddingBottom: 4,
          }}
        >
          The Digital Case · Investigation Portal
        </div>

        <div
          style={{
            fontSize: 20,
            color: "#5A5A5A",
            marginTop: 24,
            textTransform: "uppercase",
            letterSpacing: "4px",
          }}
        >
          Solve — I can investigate and solve a technical problem.
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
