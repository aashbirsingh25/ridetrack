import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { OrderStatus } from '../enums/order-status.enum';

export type OrderDocument = Order & Document;

/**
 * Order Mongoose Schema representing a delivery order document in MongoDB.
 */
@Schema({
  timestamps: { createdAt: true, updatedAt: true },
  collection: 'orders',
})
export class Order {
  @Prop({ required: true, trim: true })
  customerId: string;

  @Prop({ required: true, trim: true })
  pickupAddress: string;

  @Prop({ required: true, type: Number })
  pickupLat: number;

  @Prop({ required: true, type: Number })
  pickupLng: number;

  @Prop({ required: true, trim: true })
  dropAddress: string;

  @Prop({ required: true, type: Number })
  dropLat: number;

  @Prop({ required: true, type: Number })
  dropLng: number;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PLACED,
  })
  status: OrderStatus;

  @Prop({ type: String, default: null })
  riderId: string | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
