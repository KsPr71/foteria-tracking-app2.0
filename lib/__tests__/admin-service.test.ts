import { describe, it, expect, beforeEach, vi } from "vitest";
import { AdminService } from "../admin-service";

// Mock fetch
global.fetch = vi.fn();

describe("AdminService", () => {
  let adminService: AdminService;

  beforeEach(() => {
    adminService = AdminService.getInstance();
    vi.clearAllMocks();
  });

  describe("validateOrdersJSON", () => {
    it("debe validar JSON con estructura correcta", () => {
      const validJSON = JSON.stringify({
        metadata: {
          fecha_generacion: "2026-01-05T22:51:04",
          total_registros: 1,
          filtros_aplicados: {
            fecha_inicio: "2025-08-01",
            fecha_fin: "2026-01-05",
          },
          modelo: "pos.order",
        },
        data: [
          {
            cliente: "Test Cliente",
            orden: "Orden 01005-001-0001",
            fecha: "2025-12-30",
            estado: 0,
            productos_entrega_parcial: null,
          },
        ],
      });

      const result = adminService.validateOrdersJSON(validJSON);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("debe rechazar JSON sin metadata", () => {
      const invalidJSON = JSON.stringify({
        data: [
          {
            cliente: "Test Cliente",
            orden: "Orden 01005-001-0001",
            fecha: "2025-12-30",
            estado: 0,
          },
        ],
      });

      const result = adminService.validateOrdersJSON(invalidJSON);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("metadata");
    });

    it("debe rechazar JSON sin data", () => {
      const invalidJSON = JSON.stringify({
        metadata: {
          fecha_generacion: "2026-01-05T22:51:04",
          total_registros: 0,
        },
      });

      const result = adminService.validateOrdersJSON(invalidJSON);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("data");
    });

    it("debe rechazar JSON con data vacío", () => {
      const invalidJSON = JSON.stringify({
        metadata: {
          fecha_generacion: "2026-01-05T22:51:04",
          total_registros: 0,
        },
        data: [],
      });

      const result = adminService.validateOrdersJSON(invalidJSON);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("al menos una orden");
    });

    it("debe rechazar JSON con campos faltantes en órdenes", () => {
      const invalidJSON = JSON.stringify({
        metadata: {
          fecha_generacion: "2026-01-05T22:51:04",
          total_registros: 1,
        },
        data: [
          {
            cliente: "Test Cliente",
            // Falta campo 'orden'
            fecha: "2025-12-30",
            estado: 0,
          },
        ],
      });

      const result = adminService.validateOrdersJSON(invalidJSON);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("orden");
    });

    it("debe rechazar contenido que no es JSON", () => {
      const invalidContent = "esto no es json";

      const result = adminService.validateOrdersJSON(invalidContent);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("JSON válido");
    });
  });
});
