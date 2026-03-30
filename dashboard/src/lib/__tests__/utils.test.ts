import { describe, it, expect } from "vitest";
import {
  formatNumber,
  formatSalary,
  formatDate,
  formatDateTime,
  stateLabel,
  stateColor,
  stateBadgeVariant,
  experienceLabel,
  commandStatusVariant,
  commandStatusLabel,
} from "../utils";

describe("formatNumber", () => {
  it("formats thousands with separator", () => {
    // Intl ru-RU uses non-breaking space (\u00a0) as group separator
    expect(formatNumber(1000)).toContain("1");
    expect(formatNumber(1000)).toContain("000");
  });

  it("returns 0 for zero", () => {
    expect(formatNumber(0)).toBe("0");
  });
});

describe("formatSalary", () => {
  it("returns dash when no salary", () => {
    expect(formatSalary()).toBe("—");
    expect(formatSalary(null, null)).toBe("—");
    expect(formatSalary(undefined, undefined)).toBe("—");
  });

  it("formats from+to range", () => {
    const result = formatSalary(100000, 200000, "RUR");
    expect(result).toContain("100");
    expect(result).toContain("200");
    expect(result).toContain("₽");
    expect(result).toContain("–");
  });

  it("formats from only", () => {
    const result = formatSalary(100000, null, "RUR");
    expect(result).toMatch(/^от/);
    expect(result).toContain("₽");
  });

  it("formats to only", () => {
    const result = formatSalary(null, 200000, "RUR");
    expect(result).toMatch(/^до/);
    expect(result).toContain("₽");
  });

  it("uses currency symbols for USD and EUR", () => {
    expect(formatSalary(1000, null, "USD")).toContain("$");
    expect(formatSalary(1000, null, "EUR")).toContain("€");
  });

  it("falls back to currency code for unknown currencies", () => {
    expect(formatSalary(1000, null, "GBP")).toContain("GBP");
  });

  it("defaults to RUR when currency is not provided", () => {
    expect(formatSalary(1000, null)).toContain("₽");
  });
});

describe("formatDate", () => {
  it("returns dash for null/undefined", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
  });

  it("formats a valid date string", () => {
    const result = formatDate("2024-01-15T12:00:00Z");
    // Should contain day, month, year in some format
    expect(result).toContain("15");
    expect(result).toContain("01");
    expect(result).toContain("2024");
  });
});

describe("formatDateTime", () => {
  it("returns dash for null/undefined", () => {
    expect(formatDateTime(null)).toBe("—");
    expect(formatDateTime(undefined)).toBe("—");
  });

  it("formats a valid datetime string", () => {
    const result = formatDateTime("2024-01-15T14:30:00Z");
    expect(result).toContain("15");
    expect(result).toContain("2024");
  });
});

describe("stateLabel", () => {
  it("returns label for known states", () => {
    expect(stateLabel("interview")).toBe("Приглашение");
    expect(stateLabel("invitation")).toBe("Приглашение");
    expect(stateLabel("discard")).toBe("Отказ");
    expect(stateLabel("active")).toBe("Активный");
    expect(stateLabel("response")).toBe("Отклик");
    expect(stateLabel("sent")).toBe("Отправлен");
  });

  it("matches by prefix (startsWith)", () => {
    expect(stateLabel("discard_by_employer")).toBe("Отказ");
    expect(stateLabel("interview_scheduled")).toBe("Приглашение");
    expect(stateLabel("response_new")).toBe("Отклик");
  });

  it("returns raw state for unknown states", () => {
    expect(stateLabel("unknown_state")).toBe("unknown_state");
  });
});

describe("stateColor", () => {
  it("returns correct color for known states", () => {
    expect(stateColor("interview")).toBe("text-success");
    expect(stateColor("discard")).toBe("text-destructive");
    expect(stateColor("active")).toBe("text-accent");
    expect(stateColor("sent")).toBe("text-muted-foreground");
  });

  it("returns fallback for unknown states", () => {
    expect(stateColor("xyz")).toBe("text-muted-foreground");
  });
});

describe("stateBadgeVariant", () => {
  it("returns correct variant for known states", () => {
    expect(stateBadgeVariant("interview")).toBe("success");
    expect(stateBadgeVariant("discard")).toBe("destructive");
    expect(stateBadgeVariant("active")).toBe("default");
    expect(stateBadgeVariant("sent")).toBe("muted");
  });

  it("returns muted for unknown states", () => {
    expect(stateBadgeVariant("xyz")).toBe("muted");
  });
});

describe("experienceLabel", () => {
  it("returns dash for null/undefined", () => {
    expect(experienceLabel(null)).toBe("—");
    expect(experienceLabel(undefined)).toBe("—");
  });

  it("returns mapped labels", () => {
    expect(experienceLabel("noExperience")).toBe("Без опыта");
    expect(experienceLabel("between1And3")).toBe("1–3 года");
    expect(experienceLabel("between3And6")).toBe("3–6 лет");
    expect(experienceLabel("moreThan6")).toBe("6+ лет");
  });

  it("returns raw value for unknown keys", () => {
    expect(experienceLabel("something")).toBe("something");
  });
});

describe("commandStatusVariant", () => {
  it("returns correct variant for each status", () => {
    expect(commandStatusVariant("completed")).toBe("success");
    expect(commandStatusVariant("failed")).toBe("destructive");
    expect(commandStatusVariant("running")).toBe("warning");
    expect(commandStatusVariant("cancelled")).toBe("muted");
  });

  it("returns default for unknown status", () => {
    expect(commandStatusVariant("pending")).toBe("default");
    expect(commandStatusVariant("xyz")).toBe("default");
  });
});

describe("commandStatusLabel", () => {
  it("returns correct label for each status", () => {
    expect(commandStatusLabel("pending")).toBe("В очереди");
    expect(commandStatusLabel("running")).toBe("Выполняется");
    expect(commandStatusLabel("completed")).toBe("Завершено");
    expect(commandStatusLabel("failed")).toBe("Ошибка");
    expect(commandStatusLabel("cancelled")).toBe("Отменено");
  });

  it("returns raw status for unknown statuses", () => {
    expect(commandStatusLabel("xyz")).toBe("xyz");
  });
});
