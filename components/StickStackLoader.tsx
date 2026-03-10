"use client";

import dynamic from "next/dynamic";

const StickStack = dynamic(() => import("@/components/StickStack"), { ssr: false });

export default function StickStackLoader() {
  return <StickStack />;
}
