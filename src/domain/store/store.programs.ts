import { Effect } from "effect";
import { getEntry } from "astro:content";
import { IStoreRepository } from "./store.repository";
import { IPaymentService } from "@/infra/payment/payment.service";
import { 
  ValidationError, 
  ProductNotFoundError, 
  SponsorLimitReachedError 
} from "./store.errors";
import type { DatabaseError, HttpError } from "@/shared/errors/infrastructure.errors";
import type { TCreateStoreInvoiceProps, TCreateAdInvoiceProps, TCreateSubscribeProps } from "./store.types";

export const createStoreInvoiceProgram = (
  props: TCreateStoreInvoiceProps,
  user: any,
  origin: string,
  secretKey: string | undefined
): Effect.Effect<
  string, 
  ValidationError | ProductNotFoundError | DatabaseError | HttpError,
  IStoreRepository | IPaymentService
> =>
  Effect.gen(function* () {
    const repo = yield* IStoreRepository;
    const payment = yield* IPaymentService;

    if (!props.slug) {
      yield* Effect.fail(new ValidationError({ message: "Slug is required" }));
    }

    const page = yield* Effect.tryPromise({
      try: () => getEntry("store", props.slug as any),
      catch: () => new ProductNotFoundError({ message: "Failed to fetch store product" })
    });

    if (!page) {
      yield* Effect.fail(new ProductNotFoundError({ message: "Store product not found" }));
    }

    const price = parseInt(page.data.price || "0", 10);
    if (isNaN(price) || price <= 0) {
      yield* Effect.fail(new ValidationError({ message: "Invalid product price configuration" }));
    }

    if (!secretKey) {
      yield* Effect.fail(new ValidationError({ message: "Payment gateway key is not configured" }));
    }

    const timestamp = Date.now();
    const externalId = `store_${props.slug}_${user.id}_${timestamp}`;

    const invoice = yield* payment.createInvoice({
      externalId,
      amount: price,
      payerEmail: user.email,
      description: `Purchase: ${page.data.title}`,
      successRedirectUrl: `${origin}/store/${props.slug}?payment=success`,
      failureRedirectUrl: `${origin}/store/${props.slug}?payment=failed`,
      currency: "USD",
    }, secretKey);

    yield* repo.recordPurchase({
      userId: user.id,
      storeSlug: props.slug,
      xenditInvoiceId: invoice.id,
      amount: price,
      status: "pending",
    });

    return invoice.invoice_url;
  });

export const createAdInvoiceProgram = (
  props: TCreateAdInvoiceProps,
  user: any,
  origin: string,
  secretKey: string | undefined
): Effect.Effect<
  string, 
  ValidationError | SponsorLimitReachedError | DatabaseError | HttpError,
  IStoreRepository | IPaymentService
> =>
  Effect.gen(function* () {
    const repo = yield* IStoreRepository;
    const payment = yield* IPaymentService;

    const sponsorsCount = yield* repo.getActiveSponsorsCount();
    if (sponsorsCount >= 3) {
      yield* Effect.fail(new SponsorLimitReachedError({ 
        message: "All sponsored advertisement slots are currently full. Please try again later." 
      }));
    }

    if (!props.pkg || (props.pkg !== "article" && props.pkg !== "newsletter")) {
      yield* Effect.fail(new ValidationError({ message: "Invalid package selection" }));
    }

    const price = props.pkg === "article" ? 899 : 1299;
    const description =
      props.pkg === "article" ? "Sponsored Article Listing" : "Newsletter Advertisement Slot";

    if (!secretKey) {
      yield* Effect.fail(new ValidationError({ message: "Payment gateway key is not configured" }));
    }

    const timestamp = Date.now();
    const siteId = props.siteId || "none";
    const externalId = `adv_${props.pkg}_${user.id}_${siteId}_${timestamp}`;

    const invoice = yield* payment.createInvoice({
      externalId,
      amount: price,
      payerEmail: user.email,
      description,
      successRedirectUrl: `${origin}/dashboard/products?payment=success`,
      failureRedirectUrl: `${origin}/advertise?payment=failed`,
      currency: "USD",
    }, secretKey);

    yield* repo.recordPurchase({
      userId: user.id,
      storeSlug: `adv_${props.pkg}`,
      xenditInvoiceId: invoice.id,
      amount: price,
      status: "pending",
    });

    return invoice.invoice_url;
  });

const PLAN_PRICES: Record<string, number> = {
  team: 900,
};

export const createSubscriptionProgram = (
  props: TCreateSubscribeProps,
  user: any,
  origin: string,
  secretKey: string | undefined
): Effect.Effect<
  string,
  ValidationError | DatabaseError | HttpError,
  IStoreRepository | IPaymentService
> =>
  Effect.gen(function* () {
    const repo = yield* IStoreRepository;
    const payment = yield* IPaymentService;

    const price = PLAN_PRICES[props.plan];
    if (!price) {
      yield* Effect.fail(new ValidationError({ message: `Invalid plan: ${props.plan}` }));
    }

    if (!secretKey) {
      yield* Effect.fail(new ValidationError({ message: "Payment gateway key is not configured" }));
    }

    const timestamp = Date.now();
    const externalId = `sub_${props.plan}_${user.id}_${timestamp}`;

    const invoice = yield* payment.createInvoice({
      externalId,
      amount: price,
      payerEmail: user.email,
      description: `Kukode ${props.plan} subscription`,
      successRedirectUrl: `${origin}/dashboard?subscription=success&plan=${props.plan}`,
      failureRedirectUrl: `${origin}/pricing?subscription=failed&plan=${props.plan}`,
      currency: "USD",
    }, secretKey);

    yield* repo.recordPurchase({
      userId: user.id,
      storeSlug: `sub_${props.plan}`,
      xenditInvoiceId: invoice.id,
      amount: price,
      status: "pending",
    });

    return invoice.invoice_url;
  });
