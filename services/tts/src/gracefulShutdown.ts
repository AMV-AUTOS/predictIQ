/**
 * Central SIGTERM/SIGINT handling (issue #1800): stop accepting connections,
 * drain in-flight requests (bounded by a timeout), shut down tracing, exit.
 */
import type { Server } from "http";
import { shutdownTracing } from "./tracing";

export function registerGracefulShutdown(
  server: Server,
  timeoutMs: number = Number(process.env.TTS_SHUTDOWN_TIMEOUT_MS) > 0
    ? Number(process.env.TTS_SHUTDOWN_TIMEOUT_MS)
    : 15000,
): void {
  let shuttingDown = false;
  const shutdown = (signal: string): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received, closing HTTP listener`);
    const timer = setTimeout(() => {
      console.error("Graceful shutdown timed out; forcing exit");
      process.exit(1);
    }, timeoutMs);
    timer.unref();
    server.close(() => {
      shutdownTracing().finally(() => process.exit(0));
    });
    // Drop idle keep-alive sockets so close() can complete.
    server.closeIdleConnections?.();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
