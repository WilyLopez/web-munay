import type { ReactNode } from "react";

export default function LayoutAcceso({ children }: { children: ReactNode }) {
  return <div className="-m-8 min-h-screen">{children}</div>;
}
