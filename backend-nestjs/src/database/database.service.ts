import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.testConnection();
  }

  async testConnection(): Promise<boolean> {
    try {
      if (this.dataSource.isInitialized) {
        this.logger.log('Conexión a PostgreSQL establecida correctamente');
        return true;
      }
      this.logger.error('DataSource no está inicializado');
      return false;
    } catch (error) {
      this.logger.error(`Error al conectar con PostgreSQL: ${error.message}`);
      return false;
    }
  }

  getDataSource(): DataSource {
    return this.dataSource;
  }
}
