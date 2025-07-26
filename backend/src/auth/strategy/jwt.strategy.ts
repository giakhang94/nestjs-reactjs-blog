import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return req.cookies!['authentication'];
          // console.log(req.headers.cookie?.split('=')[1]);
          // return req.headers.Cookie!['authentication'];
          // return req.headers.cookie?.split('=')[1] as string;
        },
      ]),
      secretOrKey: configService.getOrThrow('JWT_SECRET'),
    });
  }
  async validate(payload: any) {
    //mặc định tự nhận
    return payload;
  }
}
