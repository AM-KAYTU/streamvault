import { cookies } from "next/headers";
import { verifyAdminToken } from "@/lib/tokens";
import { redirect } from "next/navigation";
import AdminSidebar from "./AdminSidebar";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token || !(await verifyAdminToken(token))) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen" style={{ background: "#0a0a0a" }}>
      <AdminSidebar />
      <main className="flex-1 p-8 ml-64 min-h-screen">{children}</main>
    </div>
  );
}
