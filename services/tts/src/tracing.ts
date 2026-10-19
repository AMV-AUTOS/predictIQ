/**
 * OpenTelemetry tracing initialization for TTS service
 */

import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";

let activeSdk: NodeSDK | undefined;

/** Flush and stop the OTEL SDK; never exits the process. */
export async function shutdownTracing(): Promise<void> {
  if (!activeSdk) return;
  try {
    await activeSdk.shutdown();
    console.log("Tracing terminated");
  } catch (error) {
    console.error("Error terminating tracing", error);
  }
}

export function initTracing() {
  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4317";
  const serviceName = process.env.OTEL_SERVICE_NAME || "predictiq-tts";
  const samplingRatio = parseFloat(process.env.OTEL_TRACE_SAMPLING_RATIO || "1.0");

  const traceExporter = new OTLPTraceExporter({
    url: otlpEndpoint,
  });

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: "1.0.0",
    }),
    traceExporter,
    instrumentations: [
      new HttpInstrumentation({
        ignoreIncomingRequestHook: (req) => req.url === "/health",
      }),
    ],
  });

  sdk.start();

  // Shutdown is coordinated centrally by gracefulShutdown.ts (issue #1800).
  activeSdk = sdk;

  return sdk;
}
