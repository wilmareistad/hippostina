import { TestBed } from '@angular/core/testing';
import { ContactMessage } from './contact';
import { ContactService } from './contact.service';
import { SupabaseService } from './supabase.service';

const MESSAGE: ContactMessage = {
  name: 'Anna',
  email: 'anna@example.com',
  message: 'Hej, jag undrar över en tavla.',
  leaveEmpty: '',
};

describe('ContactService', () => {
  let invoke: ReturnType<typeof vi.fn>;
  let service: ContactService;

  beforeEach(() => {
    invoke = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: SupabaseService, useValue: { client: { functions: { invoke } } } }],
    });
    service = TestBed.inject(ContactService);
  });

  it('sends the message to the Edge Function', async () => {
    invoke.mockResolvedValue({ data: { ok: true }, error: null });

    await service.send(MESSAGE);

    expect(invoke).toHaveBeenCalledWith('send-contact-message', { body: MESSAGE });
  });

  it('throws when the Edge Function fails', async () => {
    const failure = new Error('failed');
    invoke.mockResolvedValue({ data: null, error: failure });

    await expect(service.send(MESSAGE)).rejects.toBe(failure);
  });
});
