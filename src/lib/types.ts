export type Role = "admin" | "staff";
export type ProductCategory = "phone" | "accessory";
export type PaymentMethod = "cash" | "card" | "mobile_wallet";
export type SaleStatus = "completed" | "refunded";
export type RepairStatus = "pending" | "in_progress" | "completed" | "delivered" | "cancelled";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt?: string;
}

export interface Supplier {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt: string;
  _count?: { products: number; purchases: number };
  products?: Product[];
  purchases?: Purchase[];
}

export interface Product {
  id: number;
  name: string;
  brand?: string | null;
  category: ProductCategory;
  sku: string;
  imei?: string | null;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  lowStockThreshold: number;
  supplierId?: number | null;
  supplier?: Supplier | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt: string;
  _count?: { sales: number; repairs: number };
  sales?: Sale[];
  repairs?: RepairTicket[];
}

export interface SaleItem {
  id: number;
  saleId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  total: number;
  product?: Product;
}

export interface Sale {
  id: number;
  invoiceNumber: string;
  customerId?: number | null;
  userId?: number | null;
  customer?: Customer | null;
  user?: Pick<AuthUser, "id" | "name" | "email" | "role"> | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  createdAt: string;
  items: SaleItem[];
}

export interface PurchaseItem {
  id: number;
  purchaseId: number;
  productId: number;
  quantity: number;
  unitCost: number;
  total: number;
  product?: Product;
}

export interface Purchase {
  id: number;
  supplierId?: number | null;
  totalCost: number;
  notes?: string | null;
  createdAt: string;
  items?: PurchaseItem[];
}

export interface RepairTicket {
  id: number;
  ticketNumber: string;
  customerId?: number | null;
  customer?: Customer | null;
  deviceBrand?: string | null;
  deviceModel?: string | null;
  issueDescription: string;
  status: RepairStatus;
  estimatedCost?: number | null;
  actualCost?: number | null;
  technician?: string | null;
  receivedAt: string;
  completedAt?: string | null;
  notes?: string | null;
}

export interface DashboardSummary {
  revenueToday: number;
  revenueMonth: number;
  salesToday: number;
  salesMonth: number;
  lowStockCount: number;
  lowStockProducts: Product[];
  inventoryValue: number;
  pendingRepairs: number;
  customerCount: number;
  supplierCount: number;
  productCount: number;
  topProducts: { name: string; qty: number; revenue: number }[];
}

export interface SalesByDayPoint {
  date: string;
  revenue: number;
}
