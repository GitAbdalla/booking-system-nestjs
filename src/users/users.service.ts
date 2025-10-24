import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UpdateCreditsDto } from './dto/update-credits.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<Partial<User>[]> {
    const users = await this.userRepository.find({
      select: ['id', 'email', 'credits', 'createdAt', 'updatedAt'],
    });
    return users;
  }

  async findOne(id: string): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'credits', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async getProfile(userId: string): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['bookings', 'bookings.class'],
      select: ['id', 'email', 'credits', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateCredits(
    userId: string,
    updateCreditsDto: UpdateCreditsDto,
  ): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    
    user.credits = updateCreditsDto.credits;
    await this.userRepository.save(user);

    
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async addCredits(userId: string, amount: number): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    
    user.credits += amount;
    await this.userRepository.save(user);

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async deductCredits(userId: string, amount: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.credits < amount) {
      throw new Error('Insufficient credits');
    }

    user.credits -= amount;
    return this.userRepository.save(user);
  }

  async refundCredits(userId: string, amount: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    user.credits += amount;
    return this.userRepository.save(user);
  }
}