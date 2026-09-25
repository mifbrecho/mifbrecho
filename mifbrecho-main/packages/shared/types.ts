/**
 * Tipos compartilhados — MIF BRECHO
 */

export type UserRole = "customer" | "admin";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  sort_order: number;
}

export type ProductStatus = "available" | "sold" | "reserved" | "hidden";

export interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number; // em centavos (ex: 4990 = R$ 49,90)
  size: string | null;
  brand: string | null;
  condition: string | null; // "Novo", "Seminovo", "Usado"
  category_id: string | null;
  status: ProductStatus;
  stock: number;
  created_at: string;
  updated_at: string;
  // joins
  images?: ProductImage[];
  category?: Category;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  sort_order: number;
  is_primary: boolean;
}

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  customer_id: string;
  status: OrderStatus;
  total_amount: number; // centavos
  pix_qr_code: string | null;
  pix_copy_paste: string | null;
  pix_payment_id: string | null;
  shipping_address: Address;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // joins
  items?: OrderItem[];
  customer?: Profile;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product?: Product;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  reference?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CreatePixPaymentInput {
  orderId: string;
  amount: number; // reais (ex: 49.90)
  customerEmail: string;
  customerName: string;
  description: string;
}
