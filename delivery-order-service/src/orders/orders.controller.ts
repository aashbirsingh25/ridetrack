import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from './enums/order-status.enum';

/**
 * Controller exposing RESTful HTTP API endpoints AND RabbitMQ Microservice event handlers.
 */
@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(private readonly ordersService: OrdersService) {}

  /**
   * POST /orders
   * Create a new delivery order.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  /**
   * GET /orders
   * List all orders, optionally filtered by status (e.g. /orders?status=placed).
   */
  @Get()
  async findAll(@Query('status') status?: OrderStatus) {
    return this.ordersService.findAll(status);
  }

  /**
   * GET /orders/:id
   * Fetch details of a single order by its unique ID.
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  /**
   * PATCH /orders/:id/status
   * Update the status of an existing order.
   */
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, updateOrderStatusDto);
  }

  /**
   * Event Pattern Listener: "order_assigned"
   * Consumes messages published to RabbitMQ queue "order_assigned".
   * Payload: { orderId: string, riderId: string }
   */
  @EventPattern('order_assigned')
  async handleOrderAssigned(@Payload() data: { orderId: string; riderId: string }) {
    this.logger.log(
      `[RabbitMQ Message Received: order_assigned] Assigning order [${data?.orderId}] to rider [${data?.riderId}]`,
    );

    if (!data?.orderId || !data?.riderId) {
      this.logger.error('Invalid order_assigned event payload received', data);
      return;
    }

    return this.ordersService.updateStatus(data.orderId, {
      status: OrderStatus.ASSIGNED,
      riderId: data.riderId,
    });
  }
}
