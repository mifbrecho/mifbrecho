"use client";

/**
 * Widget de proteção contra robôs (Cloudflare Turnstile).
 * Usado em login, cadastro e recuperação de senha.
 */

import Script from "next/script";
import { useId, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
    };
  }
}

type TurnstileProps = {
  onVerify: (token: string) => void;
  onExpire?: () => void;
};

export default function Turnstile({ onVerify, onExpire }: TurnstileProps) {
  const rawId = useId();
  const containerId = `turnstile-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const renderedRef = useRef(false);

  function renderWidget() {
    if (!window.turnstile || renderedRef.current) return;
    const el = document.getElementById(containerId);
    if (!el) return;

    renderedRef.current = true;

    window.turnstile.render(el, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!,
      callback: onVerify,
      "expired-callback": onExpire,
      theme: "light",
    });
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onReady={renderWidget}
      />
      <div id={containerId} />
    </>
  );
}
