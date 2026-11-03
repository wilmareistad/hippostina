import { Component, computed, inject, signal } from '@angular/core';
import { LucideTriangleAlert } from '@lucide/angular';
import {
  formatDelivery,
  formatOrderDate,
  formatOrderNumber,
  missingEmailWarnings,
  Order,
} from '../../core/order';
import { OrderService } from '../../core/order.service';
import { formatPrice } from '../../core/price';

/** Admin overview of all orders, newest first. Warns when an email is not confirmed as sent. */
@Component({
  selector: 'app-order-list',
  imports: [LucideTriangleAlert],
  templateUrl: './order-list.html',
  styleUrl: './order-list.scss',
})
export class OrderList {
  private readonly orderService = inject(OrderService);

  protected readonly orders = signal<Order[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  /** Recalculated automatically when "orders" changes. */
  protected readonly ordersWithWarnings = computed(
    () => this.orders().filter((order) => missingEmailWarnings(order).length > 0).length,
  );

  // The template can only use what the class exposes, so the helpers are made available here.
  protected readonly formatOrderNumber = formatOrderNumber;
  protected readonly formatOrderDate = formatOrderDate;
  protected readonly formatDelivery = formatDelivery;
  protected readonly formatPrice = formatPrice;
  protected readonly missingEmailWarnings = missingEmailWarnings;

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      this.orders.set(await this.orderService.listOrders());
    } catch (error) {
      console.error(error);
      this.error.set('Kunde inte hämta ordrarna. Försök igen.');
    } finally {
      this.loading.set(false);
    }
  }
}
