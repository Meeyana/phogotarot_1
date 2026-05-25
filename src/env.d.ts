/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    session: {
      id: string;
      userId: string;
      expiresAt: Date;
    } | null;
    user: {
      id: string;
      email: string | null;
      name: string | null;
      avatar: string | null;
      role: string;
    } | null;
    runtime: {
      env: {
        DB: import('@cloudflare/workers-types').D1Database;
        [key: string]: any;
      };
    };
  }
}
