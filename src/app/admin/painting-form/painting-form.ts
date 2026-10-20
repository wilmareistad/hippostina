import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Painting, PaintingInput } from '../../core/painting';
import { PaintingService } from '../../core/painting.service';
import { kronorToOre, oreToKronor } from '../../core/price';

/** Required, and not only spaces (Validators.required accepts "   "). */
function notBlank(control: AbstractControl<string>): ValidationErrors | null {
  return control.value.trim() ? null : { required: true };
}

/** Admin form for creating a painting or editing one  */
@Component({
  selector: 'app-painting-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './painting-form.html',
  styleUrl: './painting-form.scss',
})
export class PaintingForm {
  private readonly paintingService = inject(PaintingService);
  private readonly router = inject(Router);

  /** The :id in the URL. Null on /admin/paintings/new. */
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');
  protected readonly isEdit = this.id !== null;

  protected readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [notBlank] }),
    description: new FormControl('', { nonNullable: true }),
    // Typed in kronor, saved as öre. `number | null` because an empty number field is null.
    price: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    width: new FormControl<number | null>(null, [Validators.min(1), Validators.pattern(/^\d+$/)]),
    height: new FormControl<number | null>(null, [Validators.min(1), Validators.pattern(/^\d+$/)]),
  });

  /** The painting being edited, once loaded. */
  protected readonly painting = signal<Painting | null>(null);
  protected readonly loading = signal(this.isEdit);
  protected readonly loadError = signal<string | null>(null);

  protected readonly selectedFile = signal<File | null>(null);
  protected readonly fileError = signal<string | null>(null);
  /** The native <dialog> elements in the template (#noImageDialog, #imageInput). */
  private readonly noImageDialog = viewChild.required<ElementRef<HTMLDialogElement>>('noImageDialog');
  private readonly imageInput = viewChild<ElementRef<HTMLInputElement>>('imageInput');
  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);

  /** URL of the image already saved on the painting (edit mode). */
  protected readonly currentImageUrl = computed(() => {
    const path = this.painting()?.image_path;
    return path ? this.paintingService.imageUrl(path) : null;
  });

  /** The price is locked while a customer may be paying for the painting, and after it is sold. */
  protected readonly priceLocked = computed(() => {
    const status = this.painting()?.status;
    return status === 'reserved' || status === 'sold';
  });

  constructor() {
    if (this.id) void this.load(this.id);
  }

  /** Runs when a file is picked. Warns right away if the file cannot be uploaded. */
  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    const problem = file ? this.paintingService.imageProblem(file) : null;
    this.fileError.set(problem);
    if (problem) input.value = ''; // empties the file field
    this.selectedFile.set(problem ? null : file);
  }

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.saving()) return;

    // A painting without an image is allowed, but ask first because it is easy to forget.
    const hasImage = this.selectedFile() !== null || this.painting()?.image_path != null;
    if (!hasImage) {
      this.noImageDialog().nativeElement.showModal();
      return;
    }
    await this.save();
  }

  /** "Lägg till bild" in the dialog: close it and move the cursor to the file field. */
  protected addImage(): void {
    this.noImageDialog().nativeElement.close();
    this.imageInput()?.nativeElement.focus();
  }

  /** "Spara utan bild" in the dialog. */
  protected async saveWithoutImage(): Promise<void> {
    this.noImageDialog().nativeElement.close();
    await this.save();
  }

  private async save(): Promise<void> {
    if (this.saving()) return;

    // getRawValue() also includes the price when the field is disabled.
    const value = this.form.getRawValue();
    if (value.price === null) return; // cannot happen after validation, but narrows the type

    this.saving.set(true);
    this.saveError.set(null);

    const file = this.selectedFile();
    const oldImagePath = this.painting()?.image_path ?? null;
    let newImagePath: string | null = null;
    try {
      // Upload first, then save the painting. If saving fails the new file is removed again.
      if (file) newImagePath = await this.paintingService.uploadImage(file);
      const input: PaintingInput = {
        title: value.title.trim(),
        description: value.description.trim() || null,
        price_ore: this.priceLocked()
          ? (this.painting()?.price_ore ?? kronorToOre(value.price))
          : kronorToOre(value.price),
        image_path: newImagePath ?? oldImagePath,
        width_cm: value.width,
        height_cm: value.height,
      };
      if (this.id) {
        await this.paintingService.update(this.id, input);
      } else {
        await this.paintingService.create(input);
      }
    } catch (error) {
      console.error(error);
      if (newImagePath) {
        await this.paintingService.deleteImage(newImagePath).catch(console.error);
      }
      this.saveError.set('Kunde inte spara tavlan. Försök igen.');
      this.saving.set(false);
      return;
    }

    // The painting is saved. Removing the replaced image is only cleanup, so a failure is not shown.
    if (newImagePath && oldImagePath) {
      await this.paintingService.deleteImage(oldImagePath).catch(console.error);
    }
    await this.router.navigateByUrl('/admin');
  }

  private async load(id: string): Promise<void> {
    try {
      const painting = await this.paintingService.get(id);
      if (!painting) {
        this.loadError.set('Tavlan hittades inte.');
        return;
      }
      this.painting.set(painting);
      this.form.patchValue({
        title: painting.title,
        description: painting.description ?? '',
        price: oreToKronor(painting.price_ore),
        width: painting.width_cm,
        height: painting.height_cm,
      });
      if (this.priceLocked()) this.form.controls.price.disable();
    } catch (error) {
      console.error(error);
      this.loadError.set('Kunde inte hämta tavlan. Försök igen.');
    } finally {
      this.loading.set(false);
    }
  }
}
