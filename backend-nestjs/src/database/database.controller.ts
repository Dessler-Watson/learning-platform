import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Controller('database')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get('health')
  async checkConnection() {
    const isConnected = await this.databaseService.testConnection();
    return {
      status: isConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }
}
