import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@weblens/shared-types';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getProfile(userId: string) {
    return this.userRepository.findOne({
      where: { id: userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });
  }
}
