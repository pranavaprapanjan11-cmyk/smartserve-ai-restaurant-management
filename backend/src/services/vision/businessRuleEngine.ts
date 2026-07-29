// File: backend/src/services/vision/businessRuleEngine.ts

export interface ValidationIssue {
  field: string;
  message: string;
  severity: 'WARNING' | 'ERROR';
}

export class BusinessRuleEngine {
  /**
   * Validates menu and inventory items against domain constraints.
   */
  public static validateExtractedItems(
    documentType: 'MENU' | 'INVENTORY' | 'NEEDS_REVIEW',
    menuItems: any[] = [],
    inventoryItems: any[] = []
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (documentType === 'MENU') {
      if (menuItems.length === 0) {
        issues.push({
          field: 'menu_items',
          message: 'No menu items were extracted from the document.',
          severity: 'ERROR',
        });
      }

      menuItems.forEach((item, index) => {
        if (!item.name || item.name.trim().length === 0) {
          issues.push({
            field: `menu_items[${index}].name`,
            message: `Menu item at index ${index} is missing a name.`,
            severity: 'ERROR',
          });
        }
        if (typeof item.price !== 'number' || isNaN(item.price)) {
          issues.push({
            field: `menu_items[${index}].price`,
            message: `${item.name || 'Item'} has an invalid price format.`,
            severity: 'ERROR',
          });
        } else if (item.price < 0) {
          issues.push({
            field: `menu_items[${index}].price`,
            message: `${item.name || 'Item'} has a negative price: ₹${item.price}`,
            severity: 'ERROR',
          });
        }
      });
    } else if (documentType === 'INVENTORY') {
      if (inventoryItems.length === 0) {
        issues.push({
          field: 'inventory_items',
          message: 'No inventory items were extracted from the invoice/receipt.',
          severity: 'ERROR',
        });
      }

      inventoryItems.forEach((item, index) => {
        const name = item.ingredient_name || item.name;
        if (!name || name.trim().length === 0) {
          issues.push({
            field: `inventory_items[${index}].ingredient_name`,
            message: `Inventory item at index ${index} is missing an ingredient name.`,
            severity: 'ERROR',
          });
        }
        if (typeof item.quantity === 'number' && item.quantity <= 0) {
          issues.push({
            field: `inventory_items[${index}].quantity`,
            message: `${name || 'Item'} has zero or negative quantity: ${item.quantity}`,
            severity: 'WARNING',
          });
        }
      });
    }

    return issues;
  }
}
