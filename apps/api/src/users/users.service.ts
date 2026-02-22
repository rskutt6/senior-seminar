import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { pool } from "../db";

export type CreateUserDto = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

@Injectable()
export class UsersService {
  async create(dto: CreateUserDto) {
    const { firstName, lastName, email, password } = dto;

    if (!firstName || !lastName || !email || !password) {
      throw new BadRequestException("Missing required fields");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 12);

    try {
      const result = await pool.query(
        `
        INSERT INTO public.users (first_name, last_name, email, password)
        VALUES ($1, $2, $3, $4)
        RETURNING id, first_name, last_name, email, created_at
        `,
        [firstName.trim(), lastName.trim(), normalizedEmail, passwordHash]
      );

      return result.rows[0];
    } catch (err: any) {
      // duplicate email (unique constraint violation)
      if (err?.code === "23505") {
        throw new BadRequestException("Email already exists.");
      }

      console.error("Create user error:", err);
      throw new InternalServerErrorException("Failed to create user.");
    }
  }

  async findAll() {
    try {
      const result = await pool.query(
        `
        SELECT id, first_name, last_name, email, created_at
        FROM public.users
        ORDER BY id DESC
        `
      );

      return result.rows;
    } catch (err) {
      console.error("FindAll users error:", err);
      throw new InternalServerErrorException("Failed to fetch users.");
    }
  }

  async findOne(id: number) {
    if (!id || Number.isNaN(id)) {
      throw new BadRequestException("Invalid user id");
    }

    try {
      const result = await pool.query(
        `
        SELECT id, first_name, last_name, email, created_at
        FROM public.users
        WHERE id = $1
        `,
        [id]
      );

      if (result.rows.length === 0) {
        throw new BadRequestException("User not found");
      }

      return result.rows[0];
    } catch (err) {
      if (err instanceof BadRequestException) throw err;

      console.error("FindOne user error:", err);
      throw new InternalServerErrorException("Failed to fetch user.");
    }
  }
}