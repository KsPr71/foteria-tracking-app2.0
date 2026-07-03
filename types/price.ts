export interface PriceData {
  metadata: {
    fecha_generacion: string;
  };
  data: Product[];
}

export interface ProductItem {
  nombre: string;
  cantidad: number;
}

export interface Product {
  producto: string;
  categoria: string;
  descripcion: string;
  precio: number;
  disponible: boolean;
  imagen?: string | null;
  ahorro?: number | string | null;
  productos?: ProductItem[] | string | null;
}

export interface CategoryGroup {
  categoria: string;
  productos: Product[];
}
