export interface PriceData {
  metadata: {
    fecha_generacion: string;
  };
  data: Product[];
}

export interface Product {
  producto: string;
  categoria: string;
  descripcion: string;
  precio: number;
  disponible: boolean;
}

export interface CategoryGroup {
  categoria: string;
  productos: Product[];
}
