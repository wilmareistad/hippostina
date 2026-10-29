import { inject, Injectable } from '@angular/core';
import { Painting, PaintingInput } from './painting';
import { SupabaseService } from './supabase.service';

const IMAGE_BUCKET = 'painting-images';
/** Same limits as the bucket (see the create_painting_images_bucket migration). */
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Reads and writes paintings. RLS decides what is allowed when logged in as admin
 * every painting is visible and writable, for visitors only available ones are readable.
 * Paintings are never deleted, only archived.
 */
@Injectable({ providedIn: 'root' })
export class PaintingService {
  private readonly supabase = inject(SupabaseService).client;

  /** All paintings, newest first. Only the admin gets archived, reserved and sold ones. */
  async list(): Promise<Painting[]> {
    const { data, error } = await this.supabase
      .from('paintings')
      .select('*')
      .order('created_at', { ascending: false })
      .overrideTypes<Painting[]>();
    if (error) throw error;
    return data;
  }

  /** One painting, or null if it does not exist (or RLS hides it). */
  async get(id: string): Promise<Painting | null> {
    const { data, error } = await this.supabase
      .from('paintings')
      .select('*')
      .eq('id', id)
      .maybeSingle<Painting>();
    if (error) throw error;
    return data;
  }

  /**
   * Paintings for the public shop, newest first, filtered available:
   * RLS hides other paintings from visitors, but logged in admin can see all of them.
   */
  async listAvailable(): Promise<Painting[]> {
    const { data, error } = await this.supabase
      .from('paintings')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .overrideTypes<Painting[]>();
    if (error) throw error;
    return data;
  }

  /** One painting for the public product page, or null if it is missing or not `available`. */
  async getAvailable(id: string): Promise<Painting | null> {
    const { data, error } = await this.supabase
      .from('paintings')
      .select('*')
      .eq('id', id)
      .eq('status', 'available')
      .maybeSingle<Painting>();
    if (error) throw error;
    return data;
  }

  /** New paintings always start as `available` (the column default). */
  async create(input: PaintingInput): Promise<Painting> {
    const { data, error } = await this.supabase
      .from('paintings')
      .insert(input)
      .select()
      .single<Painting>();
    if (error) throw error;
    return data;
  }

  async update(id: string, input: PaintingInput): Promise<Painting> {
    const { data, error } = await this.supabase
      .from('paintings')
      .update(input)
      .eq('id', id)
      .select()
      .single<Painting>();
    if (error) throw error;
    return data;
  }

  /** Soft delete. Old orders still point to the painting. */
  async archive(id: string): Promise<void> {
    // Only archive paintings that are available. A reserved or sold painting must not
    // be changed here, because a customer may be paying for it right now.
    await this.setStatus(id, ['available'], 'archived');
  }

  /** Undo an archive. */
  async restore(id: string): Promise<void> {
    await this.setStatus(id, ['archived'], 'available');
  }

  /**
   * The painting was sold somewhere else. Only `available` or `archived`
   * paintings: a reserved one may be in checkout right now, and a sold one is already sold.
   */
  async markSold(id: string): Promise<void> {
    await this.setStatus(id, ['available', 'archived'], 'sold');
  }

  /**
   * Permanently deletes a painting that is archived. RLS only allows archived ones, and the
   * database refuses if the painting has an order. The image file is removed afterwards.
   */
  async deleteArchived(id: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('paintings')
      .delete()
      .eq('id', id)
      .eq('status', 'archived')
      .select('id, image_path');
    // Fails with code 23503 (foreign key violation) if an order refers to this painting.
    if (error) throw error;
    if (data.length === 0) throw new Error('Painting is not archived, so it cannot be deleted.');

    // The row is gone. Removing its image is only cleanup, so a failure is not shown.
    const imagePath = (data[0] as Pick<Painting, 'image_path'>).image_path;
    if (imagePath) await this.deleteImage(imagePath).catch(console.error);
  }

  /**
   * Uploads an image under a random UUID name and returns the path to store in "image_path".
   * The name never comes from the user's file name. The server checks type and size.
   */
  async uploadImage(file: File): Promise<string> {
    const problem = this.imageProblem(file);
    if (problem) throw new Error(problem);
    const extension = IMAGE_EXTENSIONS[file.type];

    const path = `${crypto.randomUUID()}.${extension}`;
    const { error } = await this.supabase.storage
      .from(IMAGE_BUCKET)
      .upload(path, file, { contentType: file.type });
    if (error) throw error;
    return path;
  }

  /** A message if the file cannot be uploaded, otherwise null. Lets a form warn early. */
  imageProblem(file: File): string | null {
    if (!IMAGE_EXTENSIONS[file.type]) return 'Bilden måste vara JPG, PNG eller WebP.';
    if (file.size > MAX_IMAGE_BYTES) return 'Bilden får vara högst 10 MB.';
    return null;
  }

  /** Removes an image file, for example an old image that was replaced or an upload that was abandoned. */
  async deleteImage(path: string): Promise<void> {
    const { error } = await this.supabase.storage.from(IMAGE_BUCKET).remove([path]);
    if (error) throw error;
  }

  /** Public URL for an image. The bucket is public, so no login is needed to show it. */
  imageUrl(path: string): string {
    return this.supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
  }

  /** Changes status only if the painting currently has one of the "from" statuses (one atomic update). */
  private async setStatus(id: string, from: Painting['status'][], to: Painting['status']) {
    const { data, error } = await this.supabase
      .from('paintings')
      .update({ status: to })
      .eq('id', id)
      .in('status', from)
      .select('id');
    if (error) throw error;
    if (data.length === 0) {
      throw new Error(`Painting is not ${from.join(' or ')}, so it cannot become ${to}.`);
    }
  }
}
