import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config'; // 1. Import ConfigService
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<{ accessToken: string; user: Partial<User> }> {
    const { email, password } = registerDto;

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    
    const userRole =
      email === this.configService.get<string>('ADMIN_EMAIL')
        ? UserRole.ADMIN
        : UserRole.USER;

    
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      credits: userRole === UserRole.ADMIN ? 9999 : 10, 
      role: userRole, 
    });

    await this.userRepository.save(user);

    const accessToken = this.generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    return {
      accessToken,
      user: userWithoutPassword,
    };
  }

  
  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; user: Partial<User> }> {
    const { email, password } = loginDto;
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    return {
      accessToken,
      user: userWithoutPassword,
    };
  }

  private generateToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role, 
    };
    return this.jwtService.sign(payload);
  }

  async validateUser(userId: string): Promise<User> {
    
    return this.userRepository.findOne({
      where: { id: userId },
    });
  }
}