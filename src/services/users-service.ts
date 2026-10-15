import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super("Email sudah terdaftar");
    this.name = "EmailAlreadyRegisteredError";
  }
}

export class UsersService {
  /**
   * Mendaftarkan pengguna baru
   * @throws EmailAlreadyRegisteredError jika email sudah terdaftar
   */
  static async register(input: RegisterUserInput) {
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new EmailAlreadyRegisteredError();
    }

    const hashedPassword = await Bun.password.hash(input.password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    try {
      await db.insert(users).values({
        name: input.name,
        email: input.email,
        password: hashedPassword,
      });
    } catch (error: any) {
      // Race condition: email inserted between check and insert (unique constraint)
      if (error?.code === "ER_DUP_ENTRY" || error?.cause?.code === "ER_DUP_ENTRY") {
        throw new EmailAlreadyRegisteredError();
      }
      throw error;
    }

    return { data: "OK" };
  }
}

