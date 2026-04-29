import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(name: string, email: string, password: string) {
    const user = this.userRepository.create({
      name,
      email,
      password,
    });

    return this.userRepository.save(user);
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async updatePassword(userId: number, hashedPassword: string) {
    await this.userRepository.update(userId, {
      password: hashedPassword,
    });

    return this.userRepository.findOne({
      where: { id: userId },
    });
  }


  async findById(userId: number) {
    return this.userRepository.findOne({
      where: { id: userId },
    });
  }

  async updateProfile(userId: number, name: string) {
    await this.userRepository.update(userId, {
      name,
    });

    return this.findById(userId);
  }
}
