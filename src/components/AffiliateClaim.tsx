"use client";

import { useState } from "react";
import { API_BASE } from "@/lib/affiliates";

type Props = {
  affiliateSlug: string;
  streamerName: string;
};

export function AffiliateClaim({ affiliateSlug, streamerName }: Props) {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/api/v1/affiliates/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ affiliate: affiliateSlug, username }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };
      if (!res.ok || data.error) {
        setStatus("err");
        setMessage(data.error || data.message || "No se pudo reclamar");
        return;
      }
      setStatus("ok");
      setMessage(data.message || "¡Pixel+ activado por 1 día!");
    } catch {
      setStatus("err");
      setMessage("Error de red. Probá de nuevo.");
    }
  }

  return (
    <form className="affiliate-claim" onSubmit={submit}>
      <label className="affiliate-claim-label" htmlFor="mc-nick">
        Tu nick de Minecraft
      </label>
      <div className="affiliate-claim-row">
        <input
          id="mc-nick"
          className="affiliate-claim-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Steve"
          maxLength={16}
          autoComplete="off"
          spellCheck={false}
          required
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={status === "loading"}
        >
          {status === "loading" ? "…" : "Reclamar 1 día"}
        </button>
      </div>
      <p className="affiliate-claim-hint">
        Entrás por el link de <strong>{streamerName}</strong> → vos y{" "}
        <strong>{streamerName}</strong> reciben <strong>1 día de Pixel+</strong>.
        Un nick = un reclamo.
      </p>
      {message ? (
        <p
          className={
            status === "ok" ? "affiliate-claim-ok" : "affiliate-claim-err"
          }
          role="status"
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
