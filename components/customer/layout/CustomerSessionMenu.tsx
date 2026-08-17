"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, UserCheck, Loader2, Award, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  checkActiveSessionAction,
  signOutCustomerAction,
} from "@/app/(customer)/booking/otp-actions";
import {
  getMyActivePlanSummary,
  type ActivePlanSummary,
} from "@/app/(customer)/my-subscription/action";
import { formatDateForDisplay } from "@/lib/utils/dates";

/**
 * Shows who is signed in, what plan they are on, and lets them sign out.
 *
 * A twelve-hour session is a convenience on a personal phone and a liability on
 * a shared one, so the way out has to be visible rather than buried. Renders
 * nothing at all when there is no session, so the header is unchanged for
 * someone who has not verified.
 *
 * On desktop this is one chip rather than a row of three things. The number,
 * the plan and the sign-out button laid out side by side cost roughly 400px,
 * which the nav does not have to give at 1024 - everything shrank a step and
 * the bar wrapped. Collapsing them into a chip that opens a panel costs about
 * 60px instead, and the panel has room to state the plan in full, including the
 * expiry that never fit in the bar at all.
 */
export function CustomerSessionMenu({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [phone, setPhone] = useState<string | null>(null);
  const [plan, setPlan] = useState<ActivePlanSummary | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Re-checked on navigation so the control appears as soon as a customer
  // verifies, and disappears once the session lapses, without a reload. The plan
  // rides along on the same trigger: buying one should show up in the header by
  // the time the purchase redirects, and it must disappear on sign-out.
  useEffect(() => {
    let cancelled = false;

    // Navigating with the panel open would otherwise leave it hanging over the
    // new page.
    setOpen(false);

    checkActiveSessionAction()
      .then(async (session) => {
        if (cancelled) return;

        const signedIn = session.isValid && session.phone ? session.phone : null;
        setPhone(signedIn);

        if (!signedIn) {
          setPlan(null);
          return;
        }

        const summary = await getMyActivePlanSummary();
        if (!cancelled) setPlan(summary);
      })
      .catch(() => {
        if (!cancelled) {
          setPhone(null);
          setPlan(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // A dropdown that only closes by clicking its own trigger feels stuck, so it
  // also yields to a click anywhere else and to Escape.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!phone) return null;

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOutCustomerAction();
      setPhone(null);
      setOpen(false);
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

  /**
   * The plan, stated where the customer already looks to see who they are.
   *
   * Links to the subscription page rather than only informing: someone checking
   * which plan they are on is usually about to check what it costs or when it
   * runs out. Only the mobile drawer uses this now - the drawer has a row to
   * itself, so it can afford to state the plan outright.
   */
  const planBadge = plan ? (
    <Link
      href="/my-subscription"
      title={`${plan.planName} · ${plan.discountPercentage}% off every booking · valid until ${formatDateForDisplay(plan.endDate)}`}
      className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-primary transition-colors hover:border-primary hover:bg-primary/20"
    >
      <Award className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="max-w-[11rem] truncate">{plan.planName}</span>
      {plan.discountPercentage > 0 && (
        <span className="text-primary/70">{plan.discountPercentage}% off</span>
      )}
    </Link>
  ) : null;

  if (compact) {
    return (
      <div className="flex flex-col gap-2 px-4 py-3 border-t border-zinc-900">
        {planBadge && <div className="flex">{planBadge}</div>}
        <div className="flex items-center justify-between gap-3">
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
      </div>
    );
  }

  return (
    <div ref={menuRef} className="relative hidden lg:block flex-shrink-0">
      {/* Plan over number, stacked rather than side by side. The number matters
          too much to hide behind a click - on a shared machine it is the only
          thing that says *which* account this is - but laid out in a row the
          two cost the sum of their widths and the nav starts wrapping. Stacked
          they cost the wider of the two, and two short lines still measure
          about the same as the 40px logo, so the bar keeps its height. */}
      <button
        type="button"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={plan ? `Account · ${plan.planName} · ${masked}` : `Account · ${masked}`}
        title={plan ? `${plan.planName} · ${masked}` : masked}
        className={`flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap border px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wider transition-colors ${
          plan ? "rounded-xl" : "rounded-full"
        } ${
          plan
            ? "border-primary/40 bg-primary/10 text-primary hover:border-primary hover:bg-primary/20"
            : "border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white"
        } ${open ? "border-primary bg-primary/20" : ""}`}
      >
        {plan ? (
          <Award className="h-4 w-4 flex-shrink-0" />
        ) : (
          <UserCheck className="h-4 w-4 flex-shrink-0 text-primary" />
        )}

        {plan ? (
          <span className="flex min-w-0 flex-col items-start leading-tight">
            <span className="max-w-[5rem] xl:max-w-[8rem] 2xl:max-w-[11rem] truncate">
              {plan.planName}
            </span>
            {/* normal-case and a lighter weight so the number reads as the
                subtitle it is, rather than competing with the plan name. */}
            <span className="mt-0.5 text-[10px] font-bold normal-case tracking-normal text-zinc-400">
              {masked}
            </span>
          </span>
        ) : (
          <span className="max-w-[8rem] 2xl:max-w-[11rem] truncate">{masked}</span>
        )}

        <ChevronDown
          className={`h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-zinc-800 bg-[#0d0a14]/95 shadow-2xl shadow-black/60 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Who, first - it is the thing a shared-device user most needs to
              check before they act. */}
          <div className="flex items-center gap-2 px-4 py-3">
            <UserCheck className="h-4 w-4 flex-shrink-0 text-primary" />
            <span className="text-sm font-bold text-white">{masked}</span>
          </div>

          <div className="h-px bg-zinc-800" />

          {plan ? (
            /* Four facts that were previously four lines of text stacked a few
               pixels apart, in three different weights, which read as one grey
               block. They are separated here by what they are: the plan is a
               heading, the benefit sits under it, and the dates are a labelled
               pair in their own panel rather than another sentence. */
            <div className="space-y-3 px-4 py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                Active plan
              </p>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-primary/15">
                  <Award className="h-4.5 w-4.5 text-primary" />
                </div>
                <div className="min-w-0">
                  {/* No truncation here: the bar is where space is scarce, and
                      this panel exists so the full name has somewhere to live. */}
                  <p className="break-words text-sm font-black leading-snug text-white">
                    {plan.planName}
                  </p>
                  {plan.discountPercentage > 0 && (
                    <p className="mt-0.5 text-xs font-bold text-primary">
                      {plan.discountPercentage}% off every booking
                    </p>
                  )}
                </div>
              </div>

              <dl className="space-y-1.5 rounded-xl border border-zinc-800/80 bg-black/30 px-3 py-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Valid until
                  </dt>
                  <dd className="text-xs font-bold text-white">
                    {formatDateForDisplay(plan.endDate)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Time left
                  </dt>
                  {/* The last day is the one worth noticing, so it is the one
                      that changes colour. */}
                  <dd
                    className={`text-xs font-bold ${
                      plan.daysRemaining <= 3 ? "text-amber-400" : "text-white"
                    }`}
                  >
                    {plan.daysRemaining === 0
                      ? "Last day"
                      : `${plan.daysRemaining} day${plan.daysRemaining === 1 ? "" : "s"}`}
                  </dd>
                </div>
              </dl>

              <Link
                href="/my-subscription"
                className="flex items-center justify-center rounded-xl border-2 border-primary px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-primary transition-colors hover:bg-primary/10"
              >
                Manage plan
              </Link>
            </div>
          ) : (
            <div className="px-4 py-3">
              <p className="text-xs text-zinc-400">
                You don&apos;t have an active membership.
              </p>
              <Link
                href="/subscription"
                className="mt-3 flex items-center justify-center rounded-xl border-2 border-primary px-4 py-2 text-[11px] font-black uppercase tracking-wider text-primary transition-colors hover:bg-primary/10"
              >
                View plans
              </Link>
            </div>
          )}

          <div className="h-px bg-zinc-800" />

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
          >
            {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

export default CustomerSessionMenu;
