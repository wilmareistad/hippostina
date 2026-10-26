import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { LucideCamera, LucideMail, LucideMapPin } from '@lucide/angular';
import { CONTACT_LIMITS } from '../../core/contact';
import { ContactService } from '../../core/contact.service';
import { CONTACT_CONTENT } from '../contact-content';

type Field = 'name' | 'email' | 'message';
type Status = 'idle' | 'sending' | 'sent' | 'error';

/** Like Validators.required, but a value with only spaces also counts as empty. */
function notBlank(control: AbstractControl<string>): ValidationErrors | null {
  return control.value.trim() === '' ? { required: true } : null;
}

/** Contact section for the start page: contact details and a form (name, email, message). */
@Component({
  selector: 'app-contact-section',
  imports: [ReactiveFormsModule, LucideMail, LucideCamera, LucideMapPin],
  templateUrl: './contact-section.html',
  styleUrl: './contact-section.scss',
})
export class ContactSection {
  private readonly contactService = inject(ContactService);

  protected readonly content = CONTACT_CONTENT;
  protected readonly limits = CONTACT_LIMITS;

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [notBlank, Validators.maxLength(CONTACT_LIMITS.nameMax)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [
        notBlank,
        Validators.email,
        // Angular's email check accepts "anna@host" without a dot, so require one.
        Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
        Validators.maxLength(CONTACT_LIMITS.emailMax),
      ],
    }),
    message: new FormControl('', {
      nonNullable: true,
      validators: [
        notBlank,
        Validators.minLength(CONTACT_LIMITS.messageMin),
        Validators.maxLength(CONTACT_LIMITS.messageMax),
      ],
    }),
  });

  protected readonly status = signal<Status>('idle');

  /** The Swedish error text for a field, or null while it is valid or untouched. */
  protected errorMessage(field: Field): string | null {
    const control = this.form.controls[field];
    if (!control.touched || !control.errors) {
      return null;
    }
    const errors = control.errors;
    if (errors['required']) {
      return {
        name: 'Fyll i ditt namn.',
        email: 'Fyll i din e-postadress.',
        message: 'Skriv ett meddelande.',
      }[field];
    }
    if (errors['email'] || errors['pattern']) {
      return 'Fyll i en giltig e-postadress, till exempel namn@exempel.se.';
    }
    if (errors['minlength']) {
      return `Meddelandet måste vara minst ${CONTACT_LIMITS.messageMin} tecken.`;
    }
    if (errors['maxlength']) {
      return `Det får vara högst ${errors['maxlength'].requiredLength} tecken.`;
    }
    return null;
  }

  protected async onSubmit(): Promise<void> {
    if (this.status() === 'sending') {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.status.set('sending');
    try {
      const { name, email, message } = this.form.getRawValue();
      await this.contactService.send({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });
      this.form.reset();
      this.status.set('sent');
    } catch {
      this.status.set('error');
    }
  }
}
