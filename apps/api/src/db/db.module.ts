import { Module } from "@nestjs/common";
import { Pool } from "pg";

export const PG_POOL = "PG_POOL";

@Module({
  providers: [
    {
      provide: PG_POOL,
      useFactory: () => {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) throw new Error('DATABASE_URL is not set');

        return new Pool({
          connectionString,
          ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
        });
      },
    },
  ],
  exports: [PG_POOL],
})
export class DbModule {}