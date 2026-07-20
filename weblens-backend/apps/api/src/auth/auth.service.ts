import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@weblens/shared-types';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(email: string, pass: string, name?: string) {
    const hashedPassword = await bcrypt.hash(pass, 10);
    const user = this.userRepository.create({ email, password: hashedPassword, name });
    return this.userRepository.save(user);
  }

  async login(email: string, pass: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(pass, user.password))) {
      throw new UnauthorizedException();
    }
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: { id: user.id, email: user.email },
    };
  }

  async refreshToken(user: any) {
    const payload = { sub: user.sub, email: user.email };
    return this.jwtService.signAsync(payload);
  }
}
