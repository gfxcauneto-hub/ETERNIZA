import { describe, expect, it } from "vitest";
import { isAllowedTicketValue, TICKET_VALUES } from "./efiPix";

describe("Pix ticket validation", () => {
  it("accepts exactly the five configured values", () => {
    expect(TICKET_VALUES).toEqual([12.9, 14.97, 19.9, 24.9, 27.96]);
    for (const amount of TICKET_VALUES) expect(isAllowedTicketValue(amount)).toBe(true);
    expect(isAllowedTicketValue(0.01)).toBe(false);
    expect(isAllowedTicketValue(54)).toBe(false);
  });
});
