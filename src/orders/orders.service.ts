import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from './enums/order-status.enum';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
  ) {}

  /**
   * Creates a new delivery order in MongoDB.
   * Initial status is automatically set to "placed".
   */
  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const createdOrder = new this.orderModel({
      ...createOrderDto,
      status: OrderStatus.PLACED,
      riderId: null,
    });
    return createdOrder.save();
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

    return updatedOrder;
  }
}
