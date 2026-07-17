import Stripe from 'stripe';
import User from '../models/User.js';
import { sendReceiptEmail } from '../utils/email.js';
import logger from '../utils/logger.js';

let stripe;
try {
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
} catch (error) {
  logger.warn('Stripe not configured, subscription features will be disabled');
}

export const createCheckoutSession = async (req, res, next) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables.' });
    }
    
    const { planId } = req.body;
    const plans = {
      pro: { priceId: 'price_pro_monthly', amount: 999 }, // $9.99
      premium: { priceId: 'price_premium_monthly', amount: 1999 }, // $19.99
    };

    if (!plans[planId]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    let customerId = req.user.subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: `${req.user.firstName} ${req.user.lastName}`,
        metadata: { userId: req.user._id.toString() },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
            },
            unit_amount: plans[planId].amount,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_ORIGIN}/profile?success=true`,
      cancel_url: `${process.env.CLIENT_ORIGIN}/profile?canceled=true`,
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    logger.error('Stripe checkout error', error);
    next(error);
  }
};

export const handleWebhook = async (req, res, next) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe is not configured' });
  }
  
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error('Webhook signature verification failed', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        await handleSubscriptionUpdate(session.customer, session.subscription, 'active');
        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        await handleSubscriptionUpdate(subscription.customer, subscription.id, subscription.status);
        break;

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook handler error', error);
    next(error);
  }
};

const handleSubscriptionUpdate = async (customerId, subscriptionId, status) => {
  const customer = await stripe.customers.retrieve(customerId);
  const userId = customer.metadata?.userId;

  if (!userId) {
    logger.error('No userId in customer metadata');
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    logger.error('User not found for subscription update');
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const planId = subscription.items.data[0]?.price?.nickname || 'pro';

  user.subscription = {
    stripeCustomerId: customerId,
    planId: planId.toLowerCase(),
    status: status === 'active' ? 'active' : 'canceled',
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };

  await user.save();

  if (status === 'active') {
    try {
      await sendReceiptEmail(user.email, user.subscription);
    } catch (emailError) {
      logger.error('Failed to send receipt email', emailError);
    }
  }
};

export const cancelSubscription = async (req, res, next) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured' });
    }
    
    if (!req.user.subscription?.stripeCustomerId) {
      return res.status(400).json({ error: 'No active subscription' });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: req.user.subscription.stripeCustomerId,
      status: 'active',
    });

    if (subscriptions.data.length === 0) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    await stripe.subscriptions.update(subscriptions.data[0].id, {
      cancel_at_period_end: true,
    });

    req.user.subscription.cancelAtPeriodEnd = true;
    await req.user.save();

    res.json({ message: 'Subscription will be canceled at the end of the billing period' });
  } catch (error) {
    logger.error('Cancel subscription error', error);
    next(error);
  }
};

