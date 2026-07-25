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
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from './enums/order-status.enum';

/**
 * Controller exposing RESTful HTTP API endpoints for Order management.
 * Keeps routing thin and delegates business logic to OrdersService.
 */
@Controller('orders')
export class OrdersController {
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
}
