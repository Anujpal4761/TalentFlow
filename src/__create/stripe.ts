import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
  }
  return stripePromise;
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount / 100);
}

export function formatStripeAmount(amount: number): number {
  return Math.round(amount * 100);
}

export function createPaymentIntent(amount: number, currency: string = 'USD') {
  // Implementation for creating payment intent
  return {
    amount: formatStripeAmount(amount),
    currency,
  };
}
