import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { pool } from "../db";

@Injectable()
export class AuthService {
  async validateUser(email: string, password: string) {
    const result = await pool.query(
      "SELECT id, email, password_hash FROM users WHERE email = $1",
      [email]
    );

    const user = result.rows[0];
    if (!user) return null;

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return null;

    return user;
  }
}
