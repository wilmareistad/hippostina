import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js';
import { CheckoutError } from './checkout';
import { CheckoutService } from './checkout.service';
import { SupabaseService } from './supabase.service';

const PAINTING_ID = '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b';
const CHECKOUT_URL = 'https://checkout.stripe.com/c/pay/cs_test_123';

describe('CheckoutService', () => {
  let invoke: ReturnType<typeof vi.fn>;
  let assign: ReturnType<typeof vi.fn>;
  let service: CheckoutService;

  beforeEach(() => {
    invoke = vi.fn();
    assign = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseService, useValue: { client: { functions: { invoke } } } },
        { provide: DOCUMENT, useValue: { location: { assign } } },
      ],
    });
    service = TestBed.inject(CheckoutService);
  });

  async function startError(): Promise<CheckoutError> {
    const result = await service.start(PAINTING_ID, 'pickup').catch((error: unknown) => error);
    expect(result).toBeInstanceOf(CheckoutError);
    return result as CheckoutError;
  }

  it('calls create-checkout and redirects to Stripe', async () => {
    invoke.mockResolvedValue({ data: { url: CHECKOUT_URL, sessionId: 'cs_test_123' }, error: null });

    await service.start(PAINTING_ID, 'pickup');

    expect(invoke).toHaveBeenCalledWith('create-checkout', {
      body: { painting_id: PAINTING_ID, delivery: 'pickup' },
    });
    expect(assign).toHaveBeenCalledWith(CHECKOUT_URL);
  });

  it('reports unavailable on 409', async () => {
    invoke.mockResolvedValue({
      data: null,
      error: new FunctionsHttpError(new Response(null, { status: 409 })),
    });

    expect((await startError()).reason).toBe('unavailable');
    expect(assign).not.toHaveBeenCalled();
  });

  it('reports failed on a server error', async () => {
    invoke.mockResolvedValue({
      data: null,
      error: new FunctionsHttpError(new Response(null, { status: 500 })),
    });

    expect((await startError()).reason).toBe('failed');
    expect(assign).not.toHaveBeenCalled();
  });

  it('reports failed on a network error', async () => {
    invoke.mockResolvedValue({ data: null, error: new FunctionsFetchError(new TypeError('offline')) });

    expect((await startError()).reason).toBe('failed');
    expect(assign).not.toHaveBeenCalled();
  });

  it('never redirects to a URL outside Stripe Checkout', async () => {
    invoke.mockResolvedValue({
      data: { url: 'https://evil.example/checkout.stripe.com/', sessionId: 'cs_test_123' },
      error: null,
    });

    expect((await startError()).reason).toBe('failed');
    expect(assign).not.toHaveBeenCalled();
  });
});
