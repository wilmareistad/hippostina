import { TestBed } from '@angular/core/testing';
import { ContactService } from './contact.service';

describe('ContactService', () => {
  it('resolves for now (stand-in until the Edge Function exists)', async () => {
    const service = TestBed.inject(ContactService);
    await expect(
      service.send({ name: 'Anna', email: 'anna@example.com', message: 'Hej, jag undrar över en tavla.' }),
    ).resolves.toBeUndefined();
  });
});
