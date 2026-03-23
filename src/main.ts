import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';
import { AllExceptionFilter } from './all-exceptions.filter';
import { MyLoggerService } from './my-logger/my-logger.service';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // const {httpAdapter} = app.get(HttpAdapterHost)
  const logger = app.get(MyLoggerService)
  app.useGlobalFilters(new AllExceptionFilter(logger))
  
  app.enableCors();
  app.setGlobalPrefix('api')
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();


