import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import * as client from 'prom-client';

// Initialize default Node.js process metrics collection
client.collectDefaultMetrics({ prefix: 'delivery_order_' });

@Controller('metrics')
export class MetricsController {
  @Get()
  async getMetrics(@Res() res: Response) {
    res.set('Content-Type', client.register.contentType);
    res.send(await client.register.metrics());
  }
}
