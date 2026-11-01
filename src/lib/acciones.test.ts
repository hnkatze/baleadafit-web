import { describe, expect, it } from "vitest";
import { esRedireccionDeNext } from "./acciones";

describe("esRedireccionDeNext", () => {
  it("reconoce el error de control de flujo de redirect()", () => {
    expect(esRedireccionDeNext({ digest: "NEXT_REDIRECT;replace;/alimentos/abc;307;" })).toBe(true);
  });

  it("no confunde un error real con una redirección", () => {
    expect(esRedireccionDeNext(new Error("fetch failed"))).toBe(false);
    expect(esRedireccionDeNext({ digest: "12345" })).toBe(false);
    expect(esRedireccionDeNext({ status: 500 })).toBe(false);
  });

  it("tolera cualquier cosa que no sea un objeto con digest", () => {
    expect(esRedireccionDeNext(undefined)).toBe(false);
    expect(esRedireccionDeNext(null)).toBe(false);
    expect(esRedireccionDeNext("NEXT_REDIRECT")).toBe(false);
    expect(esRedireccionDeNext({ digest: 42 })).toBe(false);
  });
});
