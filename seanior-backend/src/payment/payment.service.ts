import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY')!;
    this.stripe = new Stripe(secretKey); // ใช้เวอร์ชันล่าสุด
  }

  async createPromptPayCheckoutSession() {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['promptpay'],
      line_items: [
        {
          price_data: {
            currency: 'thb',
            product_data: {
              name: 'คอร์สเรียนว่ายน้ำ',
            },
            unit_amount: 50000, // 500.00 บาท
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:3000/success',
      cancel_url: 'http://localhost:3000/cancel',
    });

    return { url: session.url }; // frontend จะ redirect ไปยัง URL นี้
  }
}
