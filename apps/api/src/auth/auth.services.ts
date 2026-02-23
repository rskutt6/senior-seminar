import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { pool } from "../db";

type LoginDto = {
  email: string;
  password: string;
};

@Injectable()
export class AuthService {
  async login(dto: LoginDto) {
    const { email, password } = dto;

    if (!email || !password) {
      throw new BadRequestException("Email and password are required");
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      // IMPORTANT: password hash is stored in column "password"
      const result = await pool.query(
        `
        SELECT id, "firstName", "lastName", email, "passwordHash"
        FROM public."User"
        WHERE email = $1
        LIMIT 1;
        `,
        [normalizedEmail],
      );

      const user = result.rows[0];
      if (!user) throw new UnauthorizedException('Invalid credentials');

      if (!password) throw new BadRequestException('Missing password');
      if (!user.passwordHash) {
        // This is the key debug line
        throw new Error(
          'User record missing passwordHash (check SELECT "passwordHash")',
        );
      }

      const ok = await bcrypt.compare(password, user.passwordHash);

      if (!ok) {
        throw new UnauthorizedException("Invalid email or password");
      }

      // Return safe user info (no password)
      return {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
      };
    } catch (err: any) {
      // If we intentionally threw 400/401, rethrow as-is
      if (
        err instanceof BadRequestException ||
        err instanceof UnauthorizedException
      ) {
        throw err;
      }

      console.error("Auth login error:", err);
      throw new InternalServerErrorException("Login failed");
    }
  }
}