import type { CategoryGroup, PriceData, Product } from "@/types/price";

const SUPABASE_URL =
  "https://lcuaqykvynaqtyqofdsv.supabase.co/storage/v1/object/public/datos/precios.json";

export class PriceService {
  private static instance: PriceService;
  private pricesCache: Product[] | null = null;

  private constructor() {}

  static getInstance(): PriceService {
    if (!PriceService.instance) {
      PriceService.instance = new PriceService();
    }
    return PriceService.instance;
  }

  /**
   * Obtiene los precios desde Supabase
   */
  async fetchPrices(forceRefresh: boolean = false): Promise<Product[]> {
    // Si tenemos datos en memoria y no se fuerza refresh, retornarlos
    if (this.pricesCache && !forceRefresh) {
      return this.pricesCache;
    }

    try {
      // Agregar timestamp a la URL para evitar caché
      const cacheBuster = `?t=${Date.now()}&_=${Math.random()}`;
      const url = `${SUPABASE_URL}${cacheBuster}`;

      console.log(`[PriceService] Fetching prices from server (forceRefresh: ${forceRefresh})`);

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

      const data: PriceData = await response.json();
      console.log(`[PriceService] Received ${data.data?.length || 0} products from server`);

      // Filtrar solo productos disponibles
      const availableProducts = data.data.filter((product) => product.disponible);

      this.pricesCache = availableProducts;

      return availableProducts;
    } catch (error) {
      console.error("Error fetching prices:", error);
      // Si hay error y tenemos caché, retornar caché
      if (this.pricesCache) {
        return this.pricesCache;
      }
      throw error;
    }
  }

  /**
   * Obtiene los precios agrupados por categoría
   */
  async getPricesGroupedByCategory(forceRefresh: boolean = false): Promise<CategoryGroup[]> {
    const products = await this.fetchPrices(forceRefresh);

    // Agrupar por categoría
    const grouped = products.reduce((acc, product) => {
      const category = product.categoria || "Sin categoría";
      const existingCategory = acc.find((group) => group.categoria === category);

      if (existingCategory) {
        existingCategory.productos.push(product);
      } else {
        acc.push({
          categoria: category,
          productos: [product],
        });
      }

      return acc;
    }, [] as CategoryGroup[]);

    // Ordenar categorías alfabéticamente
    grouped.sort((a, b) => a.categoria.localeCompare(b.categoria));

    // Ordenar productos dentro de cada categoría alfabéticamente
    grouped.forEach((group) => {
      group.productos.sort((a, b) => a.producto.localeCompare(b.producto));
    });

    return grouped;
  }

  /**
   * Limpia el caché en memoria
   */
  clearMemoryCache(): void {
    this.pricesCache = null;
  }
}
