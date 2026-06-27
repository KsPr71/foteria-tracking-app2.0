import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Order, OrderData } from "@/types/order";

const SUPABASE_URL =
  "https://vzpulvvkhralddzwthap.supabase.co/storage/v1/object/public/ordenes/datos-ordenes.json";
const CACHE_KEY = "orders_data_odoo_v1";
const CACHE_TIMESTAMP_KEY = "orders_data_odoo_v1_timestamp";
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
      // Agregar timestamp a la URL para evitar caché del navegador y de Supabase
      const cacheBuster = `?t=${Date.now()}&_=${Math.random()}`;
      const url = `${SUPABASE_URL}${cacheBuster}`;
      
      console.log(`[OrderService] Fetching orders from server (forceRefresh: ${forceRefresh})`);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: OrderData = await response.json();
      console.log(`[OrderService] Received ${data.data?.length || 0} orders from server`);
      
      // Si es force refresh, limpiar el caché en memoria primero
      if (forceRefresh) {
        this.ordersCache = null;
      }
      
      this.ordersCache = data.data;

      // Guardar en caché
      await this.cacheOrders(data.data);
      console.log(`[OrderService] Cache updated with ${data.data.length} orders`);

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
   * @param orderNumber - Número de orden a buscar
   * @param forceRefresh - Si es true, fuerza la actualización desde el servidor
   */
  async findOrder(orderNumber: string, forceRefresh: boolean = false): Promise<Order | null> {
    const orders = await this.fetchOrders(forceRefresh);
    const normalizedSearch = orderNumber.trim().toLowerCase();
    const found = orders.find((order) => order.orden.toLowerCase() === normalizedSearch);
    
    if (found) {
      console.log(`[OrderService] Found order: ${found.orden}, Estado: ${found.estado}, Cliente: ${found.cliente}`);
    } else {
      console.log(`[OrderService] Order not found: ${orderNumber}`);
    }
    
    return found || null;
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
   * Limpia el caché (tanto en memoria como en AsyncStorage)
   */
  async clearCache(): Promise<void> {
    // Limpiar caché en memoria
    this.ordersCache = null;
    try {
      await Promise.all([
        AsyncStorage.removeItem(CACHE_KEY),
        AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY),
      ]);
      console.log("Cache cleared successfully");
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  }

  /**
   * Limpia solo el caché en memoria (útil para forzar refresh sin perder AsyncStorage)
   */
  clearMemoryCache(): void {
    this.ordersCache = null;
    console.log("Memory cache cleared");
  }
}
