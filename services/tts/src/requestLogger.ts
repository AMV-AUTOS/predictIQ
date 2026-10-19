import { randomUUID } from "crypto";
import type { Request, Response, NextFunction } from "express";

/**
 * Structured (JSON-line) request logger. Emits request id, status, duration
 * and trace id, and redacts job ids from logged paths.
 */

const JOB_PATH = /^(\/tts\/job\/)[^/]+/;

export function redactPath(path: string): string {
  return path.replace(JOB_PATH, "$1:id");
}

export function logJson(level: "info" | "error", msg: string, fields: Record<string, unknown> = {}): void {
  const line = JSON.stringify({ level, time: new Date().toISOString(), msg, ...fields });
  (level === "error" ? console.error : console.log)(line);
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers["x-request-id"];
  const requestId = typeof incoming === "string" && /^[\w.-]{1,128}$/.test(incoming) ? incoming : randomUUID();
  res.setHeader("X-Request-Id", requestId);
  const traceparent = req.headers["traceparent"];
  const traceId = typeof traceparent === "string" ? traceparent.split("-")[1] : undefined;
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    logJson("info", "request", {
      requestId,
      traceId,
      method: req.method,
      path: redactPath(req.path),
      status: res.statusCode,
      durationMs: Number(process.hrtime.bigint() - start) / 1e6,
    });
  });
  next();
}
