import { logout } from "@/lib/actions/auth";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="text-sm text-gray-500 hover:text-gray-900"
      >
        Sair
      </button>
    </form>
  );
}
