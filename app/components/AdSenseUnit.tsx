"use client";

import { useEffect } from "react";

type Props = {
  client: string; // ca-pub-xxxx
  slot: string;   // 広告ユニットの slot id
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
};

export default function AdSenseUnit({
  client,
  slot,
  format = "auto",
}: Props) {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, []);

  return (
    <div style={{ marginTop: 16 }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}