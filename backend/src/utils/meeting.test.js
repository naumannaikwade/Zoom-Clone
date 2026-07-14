const {
  createMeetingId,
  formatChatMessage,
  isMeetingHost,
  normalizeMeetingId,
  sanitizeDisplayName,
} = require("./meeting");

describe("meeting helpers", () => {
  test("creates normalized eight-character meeting IDs", () => {
    expect(createMeetingId()).toMatch(/^[A-F0-9]{8}$/);
  });

  test("normalizes user-entered meeting IDs", () => {
    expect(normalizeMeetingId(" ab12cd34 ")).toBe("AB12CD34");
  });

  test("compares populated and plain host IDs", () => {
    expect(isMeetingHost({ _id: "user-1" }, "user-1")).toBe(true);
    expect(isMeetingHost("user-1", "user-2")).toBe(false);
    expect(isMeetingHost("user-1", null)).toBe(false);
  });

  test("sanitizes display names", () => {
    expect(sanitizeDisplayName("  Ada   Lovelace  ")).toBe("Ada Lovelace");
    expect(sanitizeDisplayName("", "Guest 1234")).toBe("Guest 1234");
  });

  test("formats stored chat messages for the client", () => {
    expect(formatChatMessage({
      _id: "message-1",
      meetingId: "A1B2C3D4",
      senderId: "user-1",
      senderName: "Ada",
      senderIsHost: true,
      message: "Hello",
      timestamp: "2026-07-14T12:00:00.000Z",
    })).toMatchObject({
      sender: { id: "user-1", name: "Ada", isHost: true },
      message: "Hello",
    });
  });
});
