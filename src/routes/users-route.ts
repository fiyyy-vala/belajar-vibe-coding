import { Elysia, t } from "elysia";
import { EmailAlreadyRegisteredError, UsersService } from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/api/users" })
  // Samakan format error validasi dengan spesifikasi: { "errors": "..." }
  .onError(({ code, error, set }) => {
    if (code === "VALIDATION") {
      set.status = 400;
      const first = error.all?.[0] as { schema?: { error?: string }; message?: string } | undefined;
      return { errors: first?.schema?.error ?? first?.message ?? "Request tidak valid" };
    }
  })
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const result = await UsersService.register(body);
        set.status = 200;
        return result;
      } catch (error) {
        if (error instanceof EmailAlreadyRegisteredError) {
          set.status = 400;
          return { errors: error.message };
        }

        console.error(error);
        set.status = 500;
        return { errors: "Terjadi kesalahan internal server" };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 255, error: "Nama wajib diisi" }),
        // Pattern sederhana (user@host) agar email lokal seperti "eko@localhost" tetap valid
        email: t.String({
          pattern: "^[^\\s@]+@[^\\s@]+$",
          maxLength: 255,
          error: "Format email tidak valid",
        }),
        password: t.String({ minLength: 1, maxLength: 255, error: "Password wajib diisi" }),
      }),
    }
  );
