import Stripe from 'stripe';
import config from '@app/config';

export const stripe = new Stripe(config.stripe.secretKey);
export { Stripe };
