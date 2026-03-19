// =============================================================================
// OpenTelemetry instrumentation for fayapoint-ai
// Exports: tracing spans, custom metrics, request logging
// =============================================================================

import { trace, SpanStatusCode, type Span, type Tracer } from "@opentelemetry/api";

const SERVICE_NAME = "fayapoint-ai";

function getTracer(): Tracer {
  return trace.getTracer(SERVICE_NAME);
}

// ---------- Span Helpers ----------

export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  const tracer = getTracer();
  return tracer.startActiveSpan(name, async (span) => {
    try {
      if (attributes) {
        Object.entries(attributes).forEach(([k, v]) => span.setAttribute(k, v));
      }
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      span.recordException(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      span.end();
    }
  });
}

// ---------- AI Call Tracing ----------

export async function traceAiCall<T>(
  model: string,
  action: string,
  fn: () => Promise<T>
): Promise<T> {
  return withSpan(`ai.${action}`, async (span) => {
    span.setAttribute("ai.model", model);
    span.setAttribute("ai.action", action);
    const start = Date.now();
    const result = await fn();
    span.setAttribute("ai.duration_ms", Date.now() - start);
    return result;
  });
}

// ---------- DB Call Tracing ----------

export async function traceDbCall<T>(
  collection: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  return withSpan(`db.${collection}.${operation}`, async (span) => {
    span.setAttribute("db.collection", collection);
    span.setAttribute("db.operation", operation);
    span.setAttribute("db.system", "mongodb");
    return fn();
  });
}

// ---------- Payment Tracing ----------

export async function tracePayment<T>(
  provider: string,
  method: string,
  amount: number,
  fn: () => Promise<T>
): Promise<T> {
  return withSpan("payment.process", async (span) => {
    span.setAttribute("payment.provider", provider);
    span.setAttribute("payment.method", method);
    span.setAttribute("payment.amount", amount);
    return fn();
  });
}

// ---------- API Route Tracing ----------

export async function traceRoute<T>(
  method: string,
  path: string,
  fn: () => Promise<T>
): Promise<T> {
  return withSpan(`http.${method.toLowerCase()}.${path}`, async (span) => {
    span.setAttribute("http.method", method);
    span.setAttribute("http.route", path);
    return fn();
  });
}

// ---------- Structured Logging ----------

interface LogEntry {
  level: "info" | "warn" | "error" | "debug";
  message: string;
  service: string;
  timestamp: string;
  [key: string]: unknown;
}

export function structuredLog(level: LogEntry["level"], message: string, meta?: Record<string, unknown>): void {
  const entry: LogEntry = {
    level,
    message,
    service: SERVICE_NAME,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

// ---------- Performance Metrics ----------

const requestCounts = new Map<string, number>();
const requestDurations = new Map<string, number[]>();

export function recordRequest(route: string, durationMs: number): void {
  requestCounts.set(route, (requestCounts.get(route) || 0) + 1);
  const durations = requestDurations.get(route) || [];
  durations.push(durationMs);
  if (durations.length > 1000) durations.shift(); // Rolling window
  requestDurations.set(route, durations);
}

export function getMetricsSummary(): Record<string, { count: number; avgMs: number; p95Ms: number }> {
  const summary: Record<string, { count: number; avgMs: number; p95Ms: number }> = {};
  for (const [route, count] of requestCounts.entries()) {
    const durations = requestDurations.get(route) || [];
    const sorted = [...durations].sort((a, b) => a - b);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    summary[route] = { count, avgMs: Math.round(avg), p95Ms: Math.round(p95) };
  }
  return summary;
}
