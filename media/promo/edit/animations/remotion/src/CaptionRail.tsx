import { useEffect, useState } from "react";
import {
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
type Cue = { start: number; end: number; text: string };
export const CaptionRail = () => {
  const [cues, setCues] = useState<Cue[]>([]);
  const [handle] = useState(() => delayRender("Read voiceover captions"));
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  useEffect(() => {
    fetch(staticFile("audio/captions.json"))
      .then((r) => (r.ok ? r.json() : []))
      .then((v) => setCues(Array.isArray(v) ? v : v.cues || []))
      .catch(() => setCues([]))
      .finally(() => continueRender(handle));
  }, [handle]);
  const cue = cues.find((c) => f / fps >= c.start && f / fps < c.end);
  if (!cue) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: width * 0.06,
        right: width * 0.06,
        bottom: height > width ? 92 : 78,
        display: "flex",
        justifyContent: "center",
        fontFamily: "Campus",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontSize: height > width ? 34 : 29,
          lineHeight: 1.5,
          padding: "12px 25px",
          borderRadius: 18,
          background: "#171424db",
          color: "#FFFFFF",
          textAlign: "center",
          maxWidth: height > width ? 940 : 1600,
          boxShadow: "0 8px 22px #00000010",
        }}
      >
        {cue.text}
      </div>
    </div>
  );
};
