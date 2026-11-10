import type { ReactNode } from "react";

export default function LayoutAcceso({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-[85vh] max-w-6xl items-center justify-center">
      {children}
    </main>
  );
}
