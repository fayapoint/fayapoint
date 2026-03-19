// =============================================================================
// Next.js instrumentation hook — initializes OpenTelemetry on server start
// See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
// =============================================================================

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { NodeSDK } = await import("@opentelemetry/sdk-node");
    const { OTLPTraceExporter } = await import("@opentelemetry/exporter-trace-otlp-http");
    const { resourceFromAttributes } = await import("@opentelemetry/resources");
    const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } = await import("@opentelemetry/semantic-conventions");
    const { HttpInstrumentation } = await import("@opentelemetry/instrumentation-http");

    const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

    // Only initialize if OTLP endpoint is configured
    if (otlpEndpoint) {
      const sdk = new NodeSDK({
        resource: resourceFromAttributes({
          [ATTR_SERVICE_NAME]: "fayapoint-ai",
          [ATTR_SERVICE_VERSION]: "1.0.0",
        }),
        traceExporter: new OTLPTraceExporter({
          url: `${otlpEndpoint}/v1/traces`,
        }),
        instrumentations: [new HttpInstrumentation()],
      });

      sdk.start();

      process.on("SIGTERM", () => {
        sdk.shutdown().catch(console.error);
      });

      console.log(`[OTel] fayapoint-ai tracing initialized → ${otlpEndpoint}`);
    } else {
      console.log("[OTel] No OTEL_EXPORTER_OTLP_ENDPOINT set — tracing disabled");
    }
  }
}
