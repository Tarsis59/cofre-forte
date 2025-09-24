import { Subscription } from "@/types";
import { addMonths, addYears, isFuture } from "date-fns";

export function calculateFutureBillingDates(
  subscriptions: Subscription[]
): Date[] {
  const futureDates: Date[] = [];
  const now = new Date();

  subscriptions.forEach((sub) => {
    if (!sub.isActive) return;

    let nextDate = sub.billingDate.toDate();

    if (isFuture(nextDate) || nextDate.toDateString() === now.toDateString()) {
      futureDates.push(nextDate);
    }

    for (let i = 0; i < 12; i++) {
      if (sub.cycle === "monthly") {
        nextDate = addMonths(nextDate, 1);
      } else {
        nextDate = addYears(nextDate, 1);
      }
      futureDates.push(nextDate);
    }
  });

  return futureDates;
}
