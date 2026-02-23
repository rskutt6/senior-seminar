import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.services";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() dto: { email: string; password: string }) {
    return this.authService.login(dto);
  }
}