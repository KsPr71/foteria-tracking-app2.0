import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Order, OrderStatus } from "@/types/order";

const TRACKED_ORDERS_KEY = "tracked_orders";
const TRACKED_ORDERS_STATES_KEY = "tracked_orders_states";

export interface TrackedOrder {
  orderNumber: string;
  cliente: string;
  fecha: string;
  lastKnownStatus: OrderStatus;
  addedAt: number; // timestamp
  hasUnreadChanges: boolean; // Indica si hay cambios de estado no vistos
}

/**
 * Servicio para gestionar las órdenes que el usuario quiere rastrear
 */
export class TrackedOrdersService {
  private static instance: TrackedOrdersService;

  private constructor() {}

  static getInstance(): TrackedOrdersService {
    if (!TrackedOrdersService.instance) {
      TrackedOrdersService.instance = new TrackedOrdersService();
    }
    return TrackedOrdersService.instance;
  }

  /**
   * Guarda una orden para rastrear
   */
  async addTrackedOrder(order: Order): Promise<void> {
    try {
      const tracked = await this.getTrackedOrders();
      const existingIndex = tracked.findIndex((t) => t.orderNumber === order.orden);

      const trackedOrder: TrackedOrder = {
        orderNumber: order.orden,
        cliente: order.cliente,
        fecha: order.fecha,
        lastKnownStatus: order.estado,
        addedAt: Date.now(),
        hasUnreadChanges: false, // Nueva orden, no hay cambios pendientes
      };

      if (existingIndex >= 0) {
        // Actualizar orden existente, pero preservar hasUnreadChanges si el estado no cambió
        const existing = tracked[existingIndex];
        const statusChanged = existing.lastKnownStatus !== order.estado;
        tracked[existingIndex] = {
          ...trackedOrder,
          hasUnreadChanges: statusChanged ? true : (existing.hasUnreadChanges ?? false),
        };
      } else {
        // Agregar nueva orden
        tracked.push(trackedOrder);
      }

      await AsyncStorage.setItem(TRACKED_ORDERS_KEY, JSON.stringify(tracked));
    } catch (error) {
      console.error("Error adding tracked order:", error);
      throw error;
    }
  }

  /**
   * Obtiene todas las órdenes rastreadas
   */
  async getTrackedOrders(): Promise<TrackedOrder[]> {
    try {
      const data = await AsyncStorage.getItem(TRACKED_ORDERS_KEY);
      if (!data) return [];
      const orders = JSON.parse(data);
      // Asegurar compatibilidad con órdenes antiguas que no tienen hasUnreadChanges
      return orders.map((order: TrackedOrder) => ({
        ...order,
        hasUnreadChanges: order.hasUnreadChanges ?? false,
      }));
    } catch (error) {
      console.error("Error getting tracked orders:", error);
      return [];
    }
  }

  /**
   * Elimina una orden del rastreo
   */
  async removeTrackedOrder(orderNumber: string): Promise<void> {
    try {
      const tracked = await this.getTrackedOrders();
      const filtered = tracked.filter((t) => t.orderNumber !== orderNumber);
      await AsyncStorage.setItem(TRACKED_ORDERS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error("Error removing tracked order:", error);
      throw error;
    }
  }

  /**
   * Actualiza el estado conocido de una orden rastreada y marca como no vista
   */
  async updateOrderStatus(orderNumber: string, newStatus: OrderStatus): Promise<void> {
    try {
      const tracked = await this.getTrackedOrders();
      const order = tracked.find((t) => t.orderNumber === orderNumber);
      if (order) {
        const statusChanged = order.lastKnownStatus !== newStatus;
        order.lastKnownStatus = newStatus;
        // Si el estado cambió, marcar como no vista
        if (statusChanged) {
          order.hasUnreadChanges = true;
        }
        await AsyncStorage.setItem(TRACKED_ORDERS_KEY, JSON.stringify(tracked));
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  }

  /**
   * Marca una orden como vista (sin cambios pendientes)
   */
  async markOrderAsRead(orderNumber: string): Promise<void> {
    try {
      const tracked = await this.getTrackedOrders();
      const order = tracked.find((t) => t.orderNumber === orderNumber);
      if (order) {
        order.hasUnreadChanges = false;
        await AsyncStorage.setItem(TRACKED_ORDERS_KEY, JSON.stringify(tracked));
      }
    } catch (error) {
      console.error("Error marking order as read:", error);
    }
  }

  /**
   * Obtiene el número de órdenes con cambios no vistos
   */
  async getUnreadChangesCount(): Promise<number> {
    try {
      const tracked = await this.getTrackedOrders();
      return tracked.filter((order) => order.hasUnreadChanges).length;
    } catch (error) {
      console.error("Error getting unread changes count:", error);
      return 0;
    }
  }

  /**
   * Verifica si una orden está siendo rastreada
   */
  async isOrderTracked(orderNumber: string): Promise<boolean> {
    const tracked = await this.getTrackedOrders();
    return tracked.some((t) => t.orderNumber === orderNumber);
  }
}
