"use client";

import { useEffect } from "react";

/** Liga o service worker que permite instalar o site como app. */
export default function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Não foi possível ativar o app instalável:", error);
      });
    }
  }, []);

  return null;
}
