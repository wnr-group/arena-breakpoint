"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, UserCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  checkActiveSessionAction,
  signOutCustomerAction,
} from "@/app/(customer)/booking/otp-actions";

/**
 * Shows who is signed in, and lets them sign out.
 *
 * A twelve-hour session is a convenience on a personal phone and a liability on
 * a shared one, so the way out has to be visible rather than buried. Renders
 * nothing at all when there is no session, so the header is unchanged for
 * someone who has not verified.
 */
export function CustomerSessionMenu({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [phone, setPhone] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  // Re-checked on navigation so the control appears as soon as a customer
  // verifies, and disappears once the session lapses, without a reload.
  useEffect(() => {
    let cancelled = false;

    checkActiveSessionAction()
      .then((session) => {
        if (cancelled) return;
        setPhone(session.isValid && session.phone ? session.phone : null);
      })
      .catch(() => {
        if (!cancelled) setPhone(null);
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (!phone) return null;

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOutCustomerAction();
      setPhone(null);
      toast.success("Signed Out", {
        description: "You'll need to verify your number again next time.",
      });
      // Refresh so any page holding customer data drops it immediately.
      router.refresh();
      router.push("/");
    } catch {
      toast.error("Could not sign out", { description: "Please try again." });
    } finally {
      setSigningOut(false);
    }
  };

  const masked = `+91 ${phone.slice(0, 2)}•••••${phone.slice(-3)}`;

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-zinc-900">
        <span className="flex items-center gap-2 text-xs font-bold text-zinc-400">
          <UserCheck className="h-4 w-4 text-primary" />
          {masked}
        </span>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-50"
        >
          {signingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex items-center gap-3">
      <span
        className="flex items-center gap-1.5 text-xs font-bold text-zinc-400"
        title={`Verified as +91 ${phone}`}
      >
        <UserCheck className="h-4 w-4 text-primary" />
        {masked}
      </span>
      <button
        onClick={handleSignOut}
        disabled={signingOut}
        aria-label="Sign out"
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-800 text-xs font-black uppercase tracking-wider text-zinc-400 hover:text-red-400 hover:border-red-500/40 transition-colors disabled:opacity-50"
      >
        {signingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
        Sign Out
      </button>
    </div>
  );
}

export default CustomerSessionMenu;
