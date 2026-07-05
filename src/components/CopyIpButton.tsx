"use client";

import { useState } from "react";
import { copyTextNow } from "@/lib/connect-actions";

type Props = {
  text: string;
  className?: string;
  label?: string;
  onCopied?: () => void;
  variant?: "primary" | "ghost" | "plain";
};

export function CopyTextButton({
  text,
  className = "",
  label = "Copiar",
  onCopied,
  variant = "primary",
}: Props) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    const ok = copyTextNow(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    onCopied?.();
  };

  const base =
    variant === "plain"
      ? ""
      : variant === "ghost"
        ? "btn btn-ghost"
        : "btn btn-primary";

  return (
    <button type="button" className={`${base} ${className}`.trim()} onClick={copy}>
      {copied ? "¡Copiado!" : label}
    </button>
  );
}

/** Copia la IP Java por defecto */
export { CopyTextButton as CopyIpButton };
