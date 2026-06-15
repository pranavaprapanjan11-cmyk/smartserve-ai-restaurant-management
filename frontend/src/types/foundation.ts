export type PrinterConnectionType = 'USB' | 'Bluetooth' | 'Network';

export interface RestaurantSettingsModel {
  restaurantName: string;
  logoUrl: string;
  address: string;
  contactNumber: string;
  gstNumber: string;
}

export interface PrinterConfigModel {
  printerName: string;
  connectionType: PrinterConnectionType;
  isDefault: boolean;
  status: 'Ready' | 'Offline' | 'Error';
  lastTestedAt?: string;
}

export interface BillingTemplateModel {
  restaurantName: string;
  headerTemplate: string;
  footerTemplate: string;
}

export interface TaxSettingsModel {
  taxPercent: number;
}

export interface DiscountSettingsModel {
  discountPercent: number;
  discountAmount: number;
}

export interface OrderItemModel {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export type PaymentMethodType = 'Cash' | 'UPI' | 'Card';

export interface CheckoutStateModel {
  paymentMethod: PaymentMethodType;
  showReceipt: boolean;
}
