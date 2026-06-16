import { redirect } from "next/navigation";

// The middleware redirects authenticated users to their role home and
// unauthenticated users to /login. This is a fallback for direct hits.
export default function RootPage() {
  redirect("/login");
}
