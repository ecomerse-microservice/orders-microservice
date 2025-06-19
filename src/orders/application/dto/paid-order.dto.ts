import { IsString, IsUUID, IsNumber, IsOptional, IsISO8601 } from 'class-validator';

/**
 * @class PaidOrderDto
 * @description Defines the shape of the payload for the 'payment.succeeded' event.
 */
export class PaidOrderDto {
  /**
   * @property {string} paymentId - El ID del pago (usado como stripePaymentId)
   * @decorator IsString
   */
  @IsString()
  paymentId: string;

  /**
   * @property {string} orderId - The ID (UUID/CUID) of the order that was paid.
   * @decorator IsString
   * @decorator IsUUID
   */
  @IsString()
  @IsUUID(4) // Assuming UUID v4, adjust if using CUID
  orderId: string;

  /**
   * @property {number} amount - El monto pagado
   * @decorator IsNumber
   */
  @IsNumber()
  amount: number;

  /**
   * @property {string} paidAt - La fecha de pago (se usará para generar una URL de recibo)
   * @decorator IsISO8601
   */
  @IsISO8601()
  paidAt: string;

  /**
   * @property {string} stripeChargeId - El ID de cargo de Stripe (opcional)
   * @decorator IsString
   * @decorator IsOptional
   */
  @IsString()
  @IsOptional()
  stripeChargeId?: string;

  /**
   * Compatibilidad con la versión anterior del DTO
   */
  get stripePaymentId(): string {
    return this.stripeChargeId || this.paymentId;
  }

  /**
   * Genera una URL de recibo ficticia a partir de los datos
   */
  get receiptUrl(): string {
    return `https://receipts.example.com/payments/${this.paymentId}`;
  }
}