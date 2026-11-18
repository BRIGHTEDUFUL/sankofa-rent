import { describe, expect, it } from "vitest";
import {
  CURRENCY_CODES,
  cediFromPesewas,
  currencyLabel,
  formatDate,
  formatMoney,
  friendlyError,
  initials,
  isCurrencyCode,
  parseMoney,
  pesewasFromCedi,
} from "@/lib/format";

describe("pesewasFromCedi", () => {
  it("parses plain amounts", () => {
    expect(pesewasFromCedi("1600")).toBe(160000);
    expect(pesewasFromCedi("1.5")).toBe(150);
    expect(pesewasFromCedi("0.99")).toBe(99);
  });
  it("tolerates formatting shown in the UI placeholders", () => {
    expect(pesewasFromCedi("1,600")).toBe(160000);
    expect(pesewasFromCedi("GH₵ 1,600.00")).toBe(160000);
    expect(pesewasFromCedi("gh₵ 1600")).toBe(160000);
    expect(pesewasFromCedi("GHS 1,600")).toBe(160000);
    expect(pesewasFromCedi(" 2,750.50 ")).toBe(275050);
  });
  it("accepts the other supported currency marks", () => {
    expect(parseMoney("$1,600.00")).toBe(160000);
    expect(parseMoney("€1600")).toBe(160000);
    expect(parseMoney("£1,600")).toBe(160000);
    expect(parseMoney("₦ 1600")).toBe(160000);
    expect(parseMoney("CFA 1,600")).toBe(160000);
    expect(parseMoney("USD 1600")).toBe(160000);
  });
  it("rejects invalid or non-positive amounts", () => {
    for (const bad of ["", "abc", "0", "-5", "1e5.5.5", "1,2,3,4,5,x"]) {
      expect(Number.isNaN(pesewasFromCedi(bad))).toBe(true);
    }
  });
});

describe("friendlyError", () => {
  it("unwraps the raw Convex client error to the server message", () => {
    const raw = new Error(
      "[CONVEX M(invoices:create)] [Request ID: abc123] Server Error\n" +
        "Uncaught Error: Invoice INV-1001 already covers this lease and period\n" +
        "    at handler (../convex/invoices.ts:58:25)\n\n  Called by client",
    );
    expect(friendlyError(raw)).toBe("Invoice INV-1001 already covers this lease and period");
  });
  it("passes through plain messages and uses the fallback for empty input", () => {
    expect(friendlyError(new Error("plain message"))).toBe("plain message");
    expect(friendlyError("not an error")).toBe("not an error");
    expect(friendlyError(undefined, "fallback text")).toBe("fallback text");
  });
});

describe("cediFromPesewas and formatMoney", () => {
  it("formats with the cedi symbol and two decimals by default", () => {
    expect(cediFromPesewas(160000)).toBe("GH₵ 1,600.00");
    expect(formatMoney(160000)).toBe("GH₵ 1,600.00");
  });

  it("uses the selected currency's symbol", () => {
    expect(formatMoney(160000, "USD")).toBe("$1,600.00");
    expect(formatMoney(160000, "EUR")).toBe("€1,600.00");
    expect(formatMoney(160000, "GBP")).toBe("£1,600.00");
    expect(formatMoney(160000, "NGN")).toBe("₦1,600.00");
    expect(formatMoney(160000, "XOF")).toBe("CFA 1,600.00");
    expect(cediFromPesewas(160000, "USD")).toBe("$1,600.00");
  });

  it("exposes a validated currency list with human labels", () => {
    expect(CURRENCY_CODES).toEqual(["GHS", "USD", "EUR", "GBP", "NGN", "XOF"]);
    expect(CURRENCY_CODES.every(isCurrencyCode)).toBe(true);
    expect(isCurrencyCode("ZAR")).toBe(false);
    expect(currencyLabel("XOF")).toBe("West African CFA franc");
  });
});

describe("initials and formatDate defensive handling", () => {
  it("extracts initials correctly and handles null/undefined safely", () => {
    expect(initials("Edith Mama")).toBe("EM");
    expect(initials("Kwame")).toBe("K");
    expect(initials("")).toBe("?");
    expect(initials(undefined)).toBe("?");
    expect(initials(null)).toBe("?");
  });

  it("formats dates safely without throwing on invalid values", () => {
    expect(formatDate(1794629213373.109)).toContain("2026");
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate(null)).toBe("—");
    expect(formatDate(NaN)).toBe("—");
  });
});
