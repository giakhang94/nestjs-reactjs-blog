import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { AvatarModule } from './avatar/avatar.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    AuthModule,
    PrismaModule,
    AvatarModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

//  TypeOrmModule.forRootAsync({
//       imports: [ConfigModule],
//       inject: [ConfigService],
//       useFactory: (configService: ConfigService) => {
//         return new TypeOrmConfig({
//           type: 'mysql',
//           host: configService.getOrThrow('DB_HOST'),
//           port: Number(configService.getOrThrow('DB_PORT')),
//           username: configService.getOrThrow('DB_USERNAME'),
//           password: configService.getOrThrow('DB_PASSWORD'),
//           database: configService.getOrThrow('DB_NAME'),
//           entities: [User] as any,
//           synchronize: true,
//         }).getTypeOrmConfig();
//       },
//     }),
