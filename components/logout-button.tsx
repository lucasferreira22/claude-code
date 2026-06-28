import { logout } from "@/lib/actions/auth";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="text-sm text-text-muted hover:text-text-primary transition-colors duration-200"
      >
        Sair
      </button>
    </form>
  );
}
