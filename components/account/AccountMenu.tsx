// ============================================================
// AccountMenu — the little "logged in as… / log out" corner of the header.
//
// Plain English: shows who's signed in and a Log out button, or a Log in
// link when nobody is. It renders on the SERVER so it always reflects the
// true session (no flicker). Log out runs the signOut server action.
// ============================================================

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { signOut } from "@/app/login/actions";

type Props = {
  userEmail: string | null;
};

export function AccountMenu({ userEmail }: Props) {
  if (!userEmail) {
    // A Link styled like a button (the Button primitive has no `asChild`).
    return (
      <Link href="/login" className={buttonVariants({ size: "sm", variant: "outline" })}>
        Log in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="hidden text-muted-foreground sm:inline">{userEmail}</span>
      {/* A form whose action is the signOut server action. */}
      <form action={signOut}>
        <Button size="sm" variant="outline" type="submit">
          Log out
        </Button>
      </form>
    </div>
  );
}
