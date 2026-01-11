import { describe, it, expect } from "vitest";
import { formatOrderNumber, isOrderNumberComplete, getOrderDigits } from "../order-mask";

describe("Order Mask Utilities", () => {
  describe("formatOrderNumber", () => {
    it("debe formatear números incompletos", () => {
      expect(formatOrderNumber("01005")).toBe("01005");
      expect(formatOrderNumber("01005001")).toBe("01005-001");
      expect(formatOrderNumber("010050010003")).toBe("01005-001-0003");
    });

    it("debe aplicar formato completo", () => {
      expect(formatOrderNumber("010050010003")).toBe("01005-001-0003");
      expect(formatOrderNumber("01001002001")).toBe("01001-002-001");
    });

    it("debe remover caracteres no numéricos", () => {
      expect(formatOrderNumber("01005-001-0003")).toBe("01005-001-0003");
      expect(formatOrderNumber("01005 001 0003")).toBe("01005-001-0003");
      expect(formatOrderNumber("01005abc001xyz0003")).toBe("01005-001-0003");
    });

    it("debe limitar a 12 dígitos", () => {
      expect(formatOrderNumber("0100500100031234")).toBe("01005-001-0003");
    });

    it("debe manejar entrada vacía", () => {
      expect(formatOrderNumber("")).toBe("");
    });
  });

  describe("isOrderNumberComplete", () => {
    it("debe validar formato completo correcto", () => {
      expect(isOrderNumberComplete("01005-001-0003")).toBe(true);
      expect(isOrderNumberComplete("00999-001-0002")).toBe(true);
      expect(isOrderNumberComplete("12345-678-9012")).toBe(true);
    });

    it("debe rechazar formato incompleto", () => {
      expect(isOrderNumberComplete("01005")).toBe(false);
      expect(isOrderNumberComplete("01005-001")).toBe(false);
      expect(isOrderNumberComplete("01005-001-003")).toBe(false);
    });

    it("debe rechazar formato con caracteres inválidos", () => {
      expect(isOrderNumberComplete("01005-001-000a")).toBe(false);
      expect(isOrderNumberComplete("0100a-001-0003")).toBe(false);
    });

    it("debe rechazar formato sin guiones", () => {
      expect(isOrderNumberComplete("010050010003")).toBe(false);
    });
  });

  describe("getOrderDigits", () => {
    it("debe extraer solo dígitos", () => {
      expect(getOrderDigits("01005-001-0003")).toBe("010050010003");
      expect(getOrderDigits("01005 001 0003")).toBe("010050010003");
    });

    it("debe manejar entrada sin guiones", () => {
      expect(getOrderDigits("010050010003")).toBe("010050010003");
    });

    it("debe remover todos los caracteres no numéricos", () => {
      expect(getOrderDigits("01005-001-0003abc")).toBe("010050010003");
    });
  });
});
