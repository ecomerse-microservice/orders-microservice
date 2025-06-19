// Define a minimal Product representation needed by the Orders domain
/**
 * @interface ProductValidationInfo
 * @description Minimal product information needed for validation and calculations.
 */
 export interface ProductValidationInfo {
    id: string;
    name: string;
    price: number;
    available: boolean; // To ensure we order available products
  }


/**
 * @interface ProductServicePort
 * @description Defines the contract for external communication with the product service.
 */
export interface ProductServicePort {
  /**
   * Validates a list of product IDs and returns their details.
   * @async
   * @param {string[]} ids - An array of product IDs to validate.
   * @returns {Promise<ProductValidationInfo[]>} A promise resolving with validated product details.
   * @throws {Error} If communication fails or some products are invalid/not found.
   */
  validateProductsByIds(ids: string[]): Promise<ProductValidationInfo[]>;
}

/**
 * @const {string} PRODUCT_SERVICE_PORT
 * @description Injection token for the ProductServicePort.
 */
export const PRODUCT_SERVICE_PORT = 'ProductServicePort';