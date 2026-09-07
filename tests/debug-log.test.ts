import { describe, expect, it } from "vitest";
import { DEBUG_LOG_LIMIT, formatDebugLog, sanitizeDebugLog } from "../src/core/debug-log";

describe("debug log", () => {
  it("keeps only bounded technical entries", () => {
    const entries = Array.from({ length: DEBUG_LOG_LIMIT + 2 }, (_, index) => ({
      timestamp: index,
      scope: "content",
      event: "health-check",
      details: { panelConnected: index % 2 === 0 }
    }));
    const sanitized = sanitizeDebugLog(entries);
    expect(sanitized).toHaveLength(DEBUG_LOG_LIMIT);
    expect(sanitized[0]?.timestamp).toBe(2);
  });

  it("removes unsupported detail values", () => {
    const [entry] = sanitizeDebugLog([{
      timestamp: 1,
      scope: "content",
      event: "test",
      details: { safe: true, nested: { chat: "must not be stored" } }
    }]);
    expect(entry?.details).toEqual({ safe: true });
  });

  it("formats entries as copyable lines", () => {
    expect(formatDebugLog([{
      timestamp: 0,
      scope: "content",
      event: "mounted",
      details: {}
    }])).toContain("content: mounted");
  });
});
