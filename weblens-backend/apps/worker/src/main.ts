import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.WORKER_PORT || 4001;
  app.enableShutdownHooks();
  await app.listen(port);
  console.log(`Worker is running on port: ${port}`);
}
bootstrap();
