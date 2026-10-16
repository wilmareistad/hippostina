import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { SupabaseService } from '../../core/supabase.service';

/** Admin start page. Painting CRUD and the order overview will live here. */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly router = inject(Router);
  private readonly supabase = inject(SupabaseService).client;
  protected readonly auth = inject(AuthService);

  // Temporary (sprint 1 Stripe spike): remove together with the create-checkout-test function.
  /** Set by Stripe's redirect back to /admin?checkout=success or ?checkout=cancelled. */
  protected readonly checkoutResult = inject(ActivatedRoute).snapshot.queryParamMap.get('checkout');
  protected readonly checkoutError = signal<string | null>(null);
  protected readonly checkoutLoading = signal(false);

  // Temporary sprint 1 image upload test, remove when painting CRUD exists
  /** The file picked in the file field. A `File` is the browser's object for a chosen file. */
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly uploadedUrl = signal<string | null>(null);
  protected readonly uploadError = signal<string | null>(null);
  protected readonly uploadLoading = signal(false);

  /** Runs on the file field's (change) event. */
  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile.set(input.files?.[0] ?? null);
  }

  /** Uploads the chosen file under a random UUID name and shows its public URL. */
  protected async uploadImage(): Promise<void> {
    const file = this.selectedFile();
    if (!file) return;
    this.uploadError.set(null);
    this.uploadedUrl.set(null);
    this.uploadLoading.set(true);

    // The extension comes from the MIME type the server checks it again.
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    const extension = extensions[file.type] ?? 'bin'; // unknown types are rejected by the server
    const path = `${crypto.randomUUID()}.${extension}`;

    const bucket = this.supabase.storage.from('painting-images');
    const { error } = await bucket.upload(path, file, { contentType: file.type });
    this.uploadLoading.set(false);
    if (error) {
      console.error(error);
      this.uploadError.set(`Upload failed: ${error.message}`);
      return;
    }
    this.uploadedUrl.set(bucket.getPublicUrl(path).data.publicUrl);
  }

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/admin/login');
  }

  /** Asks the Edge Function for a Stripe Checkout session and goes to Stripe's payment page. */
  protected async testCheckout(): Promise<void> {
    this.checkoutError.set(null);
    this.checkoutLoading.set(true);
    // invoke() sends the logged-in user's JWT, which the function needs.
    const { data, error } = await this.supabase.functions.invoke<{ url: string }>(
      'create-checkout-test',
      { method: 'POST' },
    );
    if (error || !data?.url) {
      console.error(error);
      this.checkoutError.set('Could not start test checkout. See the console.');
      this.checkoutLoading.set(false);
      return;
    }
    window.location.href = data.url;
  }
}
