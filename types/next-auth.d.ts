import type { DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";

import type { Role } from "@/lib/types";

declare module "next-auth" {
  interface User {
    role: Role;
    salonId: string | null;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
      salonId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    salonId: string | null;
  }
}
