import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideArrowLeft } from '@lucide/angular';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, LucideArrowLeft],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.signIn(email, password);

      if (!(await this.auth.isAdmin())) {
        await this.auth.signOut();
        this.error.set('Det här kontot har inte tillgång till admin.');
        return;
      }
      await this.router.navigateByUrl('/admin');
    } catch {
      // Same message for wrong email and wrong password, so we don't reveal which accounts exist.
      this.error.set('Kunde inte logga in. Kontrollera e-post och lösenord.');
    } finally {
      this.loading.set(false);
    }
  }
}
