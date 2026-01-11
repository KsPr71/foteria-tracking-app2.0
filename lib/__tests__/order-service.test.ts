import { describe, it, expect, beforeEach, vi } from "vitest";
import { OrderService } from "../order-service";
import type { OrderData } from "@/types/order";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn();

const mockOrderData: OrderData = {
  metadata: {
    fecha_generacion: "2026-01-05T22:51:04",
    total_registros: 3,
    filtros_aplicados: {
      fecha_inicio: "2025-08-01",
      fecha_fin: "2026-01-05",
    },
    modelo: "pos.order",
  },
  data: [
    {
      cliente: "Juan Pérez",
      orden: "Orden 01005-001-0001",
      fecha: "2025-12-30",
      estado: 0,
      productos_entrega_parcial: null,
    },
    {
      cliente: "María García",
      orden: "Orden 01005-001-0002",
      fecha: "2025-12-30",
      estado: 3,
      productos_entrega_parcial: null,
    },
    {
      cliente: "Pedro López",
      orden: "Orden 01005-001-0003",
      fecha: "2025-12-30",
      estado: 6,
      productos_entrega_parcial: "Producto A, Producto B",
    },
  ],
};

describe("OrderService", () => {
  let orderService: OrderService;

  beforeEach(() => {
    orderService = OrderService.getInstance();
    vi.clearAllMocks();
  });

  describe("validateOrderFormat", () => {
    it("debe validar formato correcto de orden", () => {
      expect(orderService.validateOrderFormat("Orden 01005-001-0001")).toBe(true);
      expect(orderService.validateOrderFormat("orden 01005-001-0001")).toBe(true);
      expect(orderService.validateOrderFormat("ORDEN 01005-001-0001")).toBe(true);
    });

    it("debe rechazar formato incorrecto de orden", () => {
      expect(orderService.validateOrderFormat("01005-001-0001")).toBe(false);
      expect(orderService.validateOrderFormat("Orden 1005-001-0001")).toBe(false);
      expect(orderService.validateOrderFormat("Orden 01005-01-0001")).toBe(false);
      expect(orderService.validateOrderFormat("Orden 01005-001-001")).toBe(false);
      expect(orderService.validateOrderFormat("")).toBe(false);
    });
  });

  describe("fetchOrders", () => {
    it("debe obtener órdenes desde Supabase", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrderData,
      });

      const orders = await orderService.fetchOrders(true);

      expect(orders).toEqual(mockOrderData.data);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://lcuaqykvynaqtyqofdsv.supabase.co/storage/v1/object/public/datos/datos-ordenes.json"
      );
    });

    it("debe manejar errores de fetch", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(orderService.fetchOrders(true)).rejects.toThrow();
    });
  });

  describe("findOrder", () => {
    beforeEach(() => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockOrderData,
      });
    });

    it("debe encontrar una orden por número exacto", async () => {
      const order = await orderService.findOrder("Orden 01005-001-0001");

      expect(order).toBeDefined();
      expect(order?.cliente).toBe("Juan Pérez");
      expect(order?.estado).toBe(0);
    });

    it("debe encontrar orden sin importar mayúsculas/minúsculas", async () => {
      const order = await orderService.findOrder("orden 01005-001-0002");

      expect(order).toBeDefined();
      expect(order?.cliente).toBe("María García");
    });

    it("debe retornar null si no encuentra la orden", async () => {
      const order = await orderService.findOrder("Orden 99999-999-9999");

      expect(order).toBeNull();
    });

    it("debe manejar espacios en el número de orden", async () => {
      const order = await orderService.findOrder("  Orden 01005-001-0003  ");

      expect(order).toBeDefined();
      expect(order?.cliente).toBe("Pedro López");
    });
  });
});
