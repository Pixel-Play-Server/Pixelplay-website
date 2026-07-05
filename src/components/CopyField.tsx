"use client";

import { useState } from "react";
import { copyTextNow } from "@/lib/connect-actions";

type Props = {
  value: string;
  label?: string;
};

/** Campo copiable — funciona en iOS aunque falle el portapapeles automático */
export function CopyField({ value, label = "Copiar" }: Props) {
  const [copied, setCopied] = useState(false);

  function copy() {
    if (copyTextNow(value)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="copy-field">
      <input
        className="copy-field-input"
        readOnly
        value={value}
        aria-label="Dirección del servidor"
        onFocus={(e) => e.currentTarget.select()}
        onClick={(e) => e.currentTarget.select()}
      />
      <button type="button" className="btn btn-primary copy-field-btn" onClick={copy}>
        {copied ? "¡Copiado!" : label}
      </button>
      <p className="copy-field-hint">Si no copia solo, mantené presionado el texto de arriba.</p>
    </div>
  );
}
