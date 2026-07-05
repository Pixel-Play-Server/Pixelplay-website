"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/lib/config";

export function ServerStatus() {
  const [players, setPlayers] = useState<string>("—");
  const [status, setStatus] = useState("Cargando…");

  useEffect(() => {
    const host = siteConfig.serverIp;
    async function load() {
      try {
        const res = await fetch(
          `https://api.mcstatus.io/v2/status/java/${encodeURIComponent(host)}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error("fail");
        const data = await res.json();
        setPlayers(
          typeof data.players?.online === "number"
            ? String(data.players.online)
            : "—"
        );
        setStatus(data.online ? "En línea" : "Fuera de línea");
      } catch {
        setStatus("Sin datos");
      }
    }
    load();
  }, []);

  return (
    <>
      <span>
        <strong>{status}</strong>
      </span>
      <span>
        <strong>{players}</strong> jugadores
      </span>
    </>
  );
}
