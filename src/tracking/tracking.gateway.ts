import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { LocationUpdateDto } from './dto/location-update.dto';
import { TrackJoinDto } from './dto/track-join.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingGateway.name);

  constructor(private readonly trackingService: TrackingService) {}

  handleConnection(client: Socket) {
    this.logger.log(`WebSocket Client Connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`WebSocket Client Disconnected: ${client.id}`);
  }

  /**
   * Event: "location:update"
   * Emitted by Rider application with real-time GPS coordinates.
   *
   * Flow:
   * 1. Save latest location to Redis under key `location:{orderId}`
   * 2. Broadcast "location:update" event to all sockets in Socket.io room `orderId`
   */
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @SubscribeMessage('location:update')
  async handleLocationUpdate(
    @MessageBody() payload: LocationUpdateDto,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(
      `[location:update] Order [${payload.orderId}] Rider [${payload.riderId}] -> (${payload.lat}, ${payload.lng})`,
    );

    // Save location to Redis
    const savedLocation = await this.trackingService.saveLocation(payload);

    // Broadcast update to all clients watching room matching orderId
    this.server.to(payload.orderId).emit('location:update', savedLocation);

    return { event: 'location:update', status: 'ok', data: savedLocation };
  }

  /**
   * Event: "track:join"
   * Emitted by Customer application to join the Socket.io room for an order.
   *
   * Flow:
   * 1. Socket client joins room named `orderId`
   * 2. Retrieves last known location for `orderId` from Redis
   * 3. Emits "location:current" back to the client with the cached location
   */
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @SubscribeMessage('track:join')
  async handleTrackJoin(
    @MessageBody() payload: TrackJoinDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { orderId } = payload;
    this.logger.log(`[track:join] Socket ${client.id} joining room: orderId [${orderId}]`);

    // Join Socket.io room
    await client.join(orderId);

    // Retrieve last known location from Redis
    const currentLocation = await this.trackingService.getLocation(orderId);

    // Emit current location back to the joining customer socket
    if (currentLocation) {
      client.emit('location:current', currentLocation);
    } else {
      client.emit('location:current', {
        orderId,
        message: 'No location updates recorded yet for this order.',
        location: null,
      });
    }

    return { event: 'track:join', status: 'joined', orderId };
  }
}
