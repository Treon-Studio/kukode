/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    runtime: {
      env: Record<string, any>;
      cf: any;
      ctx: any;
    };
    user: any;
    profile: any;
  }
}
