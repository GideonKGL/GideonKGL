import type { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface AuthenticatedUser {
      id: string;
      email: string;
      role: Role;
      firebaseUid?: string | null;
    }

    interface Request {
      id?: string;
      user?: AuthenticatedUser;
    }
  }
}

export {};
