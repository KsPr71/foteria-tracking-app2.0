import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Order, OrderData } from "@/types/order";

const SUPABASE_URL =
  "https://lcuaqykvynaqtyqofdsv.supabase.co/storage/v1/object/public/datos/datos-ordenes.json";
const CACHE_KEY = "orders_data";
const CACHE_TIMESTAMP_KEY = "orders_data_timestamp";
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutos

export class OrderService {
  private static instance: OrderService;
  private ordersCache: Order[] | null = null;

  private constructor() {}

  static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }
    return OrderService.instance;
  }

  /**
   * Obtiene los datos de órdenes desde Supabase o caché
   */
  async fetchOrders(forceRefresh: boolean = false): Promise<Order[]> {
    // Si tenemos datos en memoria y no se fuerza refresh, retornarlos
    if (this.ordersCache && !forceRefresh) {
      return this.ordersCache;
    }

    // Verificar caché local
    if (!forceRefresh) {
      const cachedData = await this.getCachedOrders();
      if (cachedData) {
        this.ordersCache = cachedData;
        return cachedData;
      }
    }

    // Fetch desde Supabase
    try {
      const response = await fetch(SUPABASE_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: OrderData = await response.json();
      this.ordersCache = data.data;

      // Guardar en caché
      await this.cacheOrders(data.data);

      return data.data;
    } catch (error) {
      console.error("Error fetching orders:", error);
      // Si hay error, intentar usar caché aunque esté expirado
      const cachedData = await this.getCachedOrders(true);
      if (cachedData) {
        this.ordersCache = cachedData;
        return cachedData;
      }
      throw error;
    }
  }

  /**
   * Busca una orden por su número
   */
  async findOrder(orderNumber: string): Promise<Order | null> {
    const orders = await this.fetchOrders();
    const normalizedSearch = orderNumber.trim().toLowerCase();
    return orders.find((order) => order.orden.toLowerCase() === normalizedSearch) || null;
  }

  /**
   * Valida el formato del número de orden
   */
  validateOrderFormat(orderNumber: string): boolean {
    // Formato: Orden XXXXX-XXX-XXXX
    const regex = /^orden\s+\d{5}-\d{3}-\d{4}$/i;
    return regex.test(orderNumber.trim());
  }

  /**
   * Obtiene órdenes desde caché local
   */
  private async getCachedOrders(ignoreExpiration: boolean = false): Promise<Order[] | null> {
    try {
      const [cachedData, timestamp] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEY),
        AsyncStorage.getItem(CACHE_TIMESTAMP_KEY),
      ]);

      if (!cachedData || !timestamp) {
        return null;
      }

      // Verificar si el caché ha expirado
      if (!ignoreExpiration) {
        const cacheAge = Date.now() - parseInt(timestamp, 10);
        if (cacheAge > CACHE_DURATION) {
          return null;
        }
      }

      return JSON.parse(cachedData);
    } catch (error) {
      console.error("Error reading cache:", error);
      return null;
    }
  }

  /**
   * Guarda órdenes en caché local
   */
  private async cacheOrders(orders: Order[]): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(orders)),
        AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString()),
      ]);
    } catch (error) {
      console.error("Error caching orders:", error);
    }
  }

  /**
   * Limpia el caché
   */
  async clearCache(): Promise<void> {
    this.ordersCache = null;
    try {
      await Promise.all([
        AsyncStorage.removeItem(CACHE_KEY),
        AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY),
      ]);
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  }
}
