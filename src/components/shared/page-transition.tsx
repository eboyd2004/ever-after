"use client";

import { useEffect, useState, type ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let showFrame = 0;
    const hideFrame = requestAnimationFrame(() => {
      setVisible(false);
      showFrame = requestAnimationFrame(() => setVisible(true));
    });

    return () => {
      cancelAnimationFrame(hideFrame);
      cancelAnimationFrame(showFrame);
    };
  }, [children]);

  return (
    <div className={visible ? "page-transition page-transition-visible" : "page-transition"}>
      {children}
    </div>
  );
}
