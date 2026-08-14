# Verifying the walk-in session flow

A walk-in is now created empty, checked in when the customer arrives, and billed
at checkout from the time between those two server timestamps. The lifecycle is
enforced in Postgres, so the meaningful test is against a real database.

## 1. Apply the migration

```bash
supabase db push          # or: supabase migration up --local
```

`20260814100000_walkin_actual_time_billing.sql` adds `billed_on_actual_time` and
the `walk_in_*` intent columns, widens `duration_hours` so an overnight session
fits, and adds `checkin_walkin_session` / `checkout_walkin_session`.

If PostgREST returns `PGRST204` for a new column, reload its cache:

```sql
NOTIFY pgrst, 'reload schema';
```

## 2. The worked example

1. **Admin → Bookings → New walk-in.** Leave the toggle on **Walk-in now**.
2. Pick a device type, enter the customer, create it. Note the time — call it 8:55.
3. The booking appears as **Not checked in · booked 8:55**, with a Check In action
   and no station, no duration and no price anywhere on it.
4. Wait, then press **Check In** — call it 9:00. It becomes **Playing 0m · since
   9:00** and is given a station.
5. Leave it running. The card counts up.
6. Press **Check Out** at 11:45.

**Expected:** the toast reads *"Checked out — 2h 45m played"*, and the bill is
2.75 × the hourly rate. The 8:55 creation time appears nowhere in it.

```sql
select b.booking_number, b.status,
       b.created_at, b.checked_in_at, b.completed_at,
       round(extract(epoch from (b.completed_at - b.checked_in_at))/60) as billed_minutes,
       s.slot_start_time, s.slot_end_time, s.duration_hours,
       b.device_subtotal, b.total_amount
from bookings b
join booking_device_slots s on s.booking_id = b.id
where b.booking_number = '<the number>';
```

`slot_start_time` must equal the **check-in** time, not the creation time, and
`duration_hours` must match `billed_minutes / 60`.

## 3. Invalid actions

Each of these is refused server-side, not only in the UI. The quickest way to
prove it is to call the functions directly.

| Attempt | Expected |
| --- | --- |
| Check out a booking that was never checked in | "This customer has not checked in yet" |
| Check out twice | "This session has already been checked out" |
| Check in twice | "This customer is already checked in" |
| Check in a cancelled booking | "A cancelled booking cannot be checked in" |
| Use the fixed-slot Check Out on a session | "Use Check Out on the session so the bill is calculated from the time played" |
| Use the session Check In on an online booking | "not an open-ended walk-in session" |

## 4. Device allocation

The station is claimed at **check-in**, not at creation — so two walk-ins can be
created for the last PS5 and whoever checks in first gets it.

1. Fill every station of a type (check walk-ins in until none are left).
2. Create one more walk-in for that type and press **Check In**.

**Expected:** *"Every PS5 Console is in use right now."* The booking stays in
**Not checked in** — it is not left half-started — and no second booking is ever
given an occupied station.

```sql
-- Must return no rows: one station, one live session.
select s.device_id, count(*)
from booking_device_slots s
join bookings b on b.id = s.booking_id
where b.status = 'checked_in'
group by s.device_id having count(*) > 1;
```

## 5. Edge cases

| Case | Expected |
| --- | --- |
| 9:00 → 9:30 | 30m, half the hourly rate |
| 9:00 → 11:45 | 2h 45m, 2.75 × rate |
| 9:00 → past midnight | Billed across the date boundary; the slot keeps its start date |
| Checked in, never checked out | Stays **Playing**; the station stays occupied until staff close it |
| Cancelled before check-in | Nothing to release — no station was ever claimed |
| Session longer than 5 hours | Prices correctly. The station was provisionally held for 5h, so a booking taken for later in the day could overlap the tail — see the assumption below |

## 6. Billing and discounts

`Checkout & Billing` prices from the recomputed `total_amount`. Settle the payment
there as normal; the checkout guard refuses to close a session that has not been
checked in.

Both discounts are resolved **at checkout**, against the hours actually played:

| Discount | Rule on a session |
| --- | --- |
| Subscription | The customer's active membership percentage, applied to the device subtotal (play + extra players, never food). Resolved from their phone at checkout, so a membership that lapsed mid-session does not apply. |
| Happy hour | The existing rule, unchanged and strict: `isSlotWithinTimeRange` requires the **whole** session to sit inside the rule's hours. A customer who plays past the end of a happy hour loses it entirely — the same thing that happens to a fixed booking that does not fit. A session crossing midnight never qualifies. |

Combined discounts are capped at the device subtotal, so play can never come out
negative. Both write their own line item, so the receipt shows why the number moved.

**To test:** give the customer an active subscription, create a happy hour rule
covering the next hour for that device type, then run a short session inside the
window and check the breakdown:

```sql
select item_type, description, line_total
from booking_line_items
where booking_id = '<id>'
order by display_order;

select device_subtotal, subscription_discount, happy_hour_discount, total_amount
from bookings where id = '<id>';
```

Then run a second session that deliberately overruns the happy hour window and
confirm `happy_hour_discount` comes back as 0.

## Assumptions worth confirming

1. The station is held for a provisional **5 hours** from check-in
   (`PROVISIONAL_SESSION_HOURS`). A session that runs longer has its slot rewritten
   to the true window at checkout, which could in principle overlap a booking taken
   for that station later the same day. Raise the constant, or refuse advance
   bookings on a station with a live session, if that matters on your floor.
2. **Happy hour is all-or-nothing on a session**, because that is what the existing
   rule does. A customer who plays 10:00–13:30 through a 10:00–12:00 happy hour
   gets no discount at all rather than two discounted hours. If the floor expects
   the discounted hours to be honoured pro-rata, that is a change to
   `isSlotWithinTimeRange` and would affect online bookings too.
3. **Promo codes are not offered on walk-in sessions.** There is no field to enter
   one, matching the previous walk-in form; an existing `promo_discount` on the
   row is still respected at checkout.
