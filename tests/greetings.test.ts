import { describe, expect, it } from "vitest";
import { addressesUser, looksLikeGreeting, usernameAliases } from "../src/core/greetings";

describe("automatic greeting candidates", () => {
  it("recognizes common German and English greetings", () => {
    expect(looksLikeGreeting("Hallo Thomas!"),).toBe(true);
    expect(looksLikeGreeting("moin zusammen")).toBe(true);
    expect(looksLikeGreeting("welcome back")).toBe(true);
  });

  it("does not match words that only contain hi", () => {
    expect(looksLikeGreeting("this is fine")).toBe(false);
  });

  it("recognizes mentions and reply context", () => {
    expect(addressesUser("Hi @PJLauch", "", "PJLauch")).toBe(true);
    expect(addressesUser("Danke!", "Replying to PJLauch", "PJLauch")).toBe(true);
    expect(addressesUser("Hallo jemand anderes", "", "PJLauch")).toBe(false);
  });

  it("recognizes clear username parts without matching arbitrary substrings", () => {
    expect(usernameAliases("PJLauch")).toEqual(["PJLauch", "PJL", "Lauch"]);
    expect(addressesUser("Hi PJL", "", "PJLauch")).toBe(true);
    expect(addressesUser("Hallo Lauch", "", "PJLauch")).toBe(true);
    expect(addressesUser("Das PJLauchhaus", "", "PJLauch")).toBe(false);
  });
});
