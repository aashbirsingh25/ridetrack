import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { ClientProxy } from '@nestjs/microservices';
import { Order, OrderDocument } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from './enums/order-status.enum';
import { ORDER_SERVICE_RMQ } from './orders.constants';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @Inject(ORDER_SERVICE_RMQ) private readonly client: ClientProxy,
  ) {}

  /**
   * Creates a new delivery order in MongoDB and emits an "order_placed" event to RabbitMQ.
   * Initial status is automatically set to "placed".
   */
  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const createdOrder = new this.orderModel({
      ...createOrderDto,
      status: OrderStatus.PLACED,
      riderId: null,
    });

    const savedOrder = await createdOrder.save();
    const orderId = (savedOrder._id || savedOrder.id).toString();

    // Prepare fire-and-forget payload for RabbitMQ
    const eventPayload = {
      orderId,
      pickupLat: savedOrder.pickupLat,
      pickupLng: savedOrder.pickupLng,
      dropLat: savedOrder.dropLat,
      dropLng: savedOrder.dropLng,
    };

    try {
      this.client.emit('order_placed', eventPayload);
      this.logger.log(
        `[RabbitMQ Event Emitted: order_placed] Order ID: ${orderId} -> pickup: (${savedOrder.pickupLat}, ${savedOrder.pickupLng})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to emit "order_placed" event to RabbitMQ for order [${orderId}]`,
        error,
      );
    }

    return savedOrder;
  }

  /**
   * Retrieves all orders from MongoDB.
   * Optionally filters orders by their status query parameter (e.g. ?status=placed).
   */
  async findAll(status?: OrderStatus): Promise<Order[]> {
    const filter: Record<string, any> = {};

    if (status) {
      // Validate status enum value if status query parameter was provided
      if (!Object.values(OrderStatus).includes(status)) {
        throw new BadRequestException(
          `Invalid status filter. Allowed values: ${Object.values(OrderStatus).join(', ')}`,
        );
      }
      filter.status = status;
    }

    return this.orderModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  /**
   * Retrieves a single order by its MongoDB ObjectId (_id).
   */
  async findOne(id: string): Promise<Order> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid MongoDB ObjectId format: '${id}'`);
    }

    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException(`Order with ID '${id}' not found`);
    }

    return order;
  }

  /**
   * Updates an order's status and optionally assigns/updates riderId.
   */
  async updateStatus(
    id: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid MongoDB ObjectId format: '${id}'`);
    }

    const { status, riderId } = updateOrderStatusDto;
    const updateData: Record<string, any> = { status };

    if (riderId !== undefined) {
      updateData.riderId = riderId;
    }

    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .exec();

    if (!updatedOrder) {
      throw new NotFoundException(`Order with ID '${id}' not found`);
    }

    this.logger.log(
      `Order [${id}] status updated to "${status}" (riderId: ${riderId || 'N/A'})`,
    );

    return updatedOrder;
  }
}
