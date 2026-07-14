const jwt = require("jsonwebtoken");
const ChatMessage = require("../models/ChatMessage");
const Meeting = require("../models/Meeting");
const User = require("../models/User");
const {
  formatChatMessage,
  isMeetingHost,
  normalizeMeetingId,
  sanitizeDisplayName,
} = require("../utils/meeting");

const noop = () => {};

module.exports = (io) => {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      socket.data.identity = {
        id: null,
        name: `Guest ${socket.id.slice(0, 4)}`,
        isGuest: true,
      };
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("name");

      if (!user) {
        return next(new Error("Authentication failed"));
      }

      socket.data.identity = {
        id: user._id.toString(),
        name: sanitizeDisplayName(user.name),
        isGuest: false,
      };
      return next();
    } catch {
      return next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const isInMeeting = (meetingId) => {
      return socket.data.meetingId === meetingId && socket.rooms.has(meetingId);
    };

    const markParticipantLeft = async (meetingId) => {
      if (!meetingId) return;

      await Meeting.updateOne(
        { meetingId, "participants.socketId": socket.id },
        { $set: { "participants.$.leftAt": new Date() } }
      );
    };

    const leaveCurrentMeeting = async () => {
      const meetingId = socket.data.meetingId;
      if (!meetingId) return;

      await markParticipantLeft(meetingId);
      socket.to(meetingId).emit("user-left", { socketId: socket.id });
      await socket.leave(meetingId);
      socket.data.meetingId = null;
      socket.data.user = null;
    };

    socket.on("join-room", async (data = {}, callback = noop) => {
      const meetingId = normalizeMeetingId(data.meetingId);

      try {
        const meeting = await Meeting.findOne({ meetingId, isActive: true });
        if (!meeting) {
          return callback({ success: false, message: "Meeting is unavailable" });
        }

        if (socket.data.meetingId && socket.data.meetingId !== meetingId) {
          await leaveCurrentMeeting();
        }

        const identity = socket.data.identity;
        const room = io.sockets.adapter.rooms.get(meetingId);
        const participants = room
          ? Array.from(room)
              .filter((socketId) => socketId !== socket.id)
              .map((socketId) => {
                const participantSocket = io.sockets.sockets.get(socketId);
                return participantSocket?.data.user
                  ? { socketId, user: participantSocket.data.user }
                  : null;
              })
              .filter(Boolean)
          : [];

        const roomUser = {
          id: identity.id,
          name: identity.isGuest
            ? sanitizeDisplayName(data.user?.name, identity.name)
            : identity.name,
          isGuest: identity.isGuest,
          isHost: isMeetingHost(meeting.hostId, identity.id),
        };

        if (!isInMeeting(meetingId)) {
          await socket.join(meetingId);
          socket.data.meetingId = meetingId;
          socket.data.user = roomUser;

          await Meeting.updateOne(
            { _id: meeting._id },
            {
              $push: {
                participants: {
                  userId: identity.id,
                  name: roomUser.name,
                  isGuest: roomUser.isGuest,
                  isHost: roomUser.isHost,
                  joinedAt: new Date(),
                  socketId: socket.id,
                },
              },
            }
          );

          socket.to(meetingId).emit("user-joined", {
            socketId: socket.id,
            user: roomUser,
          });
        }

        socket.emit("room-participants", { participants });
        return callback({ success: true, self: roomUser });
      } catch (error) {
        console.error("Unable to join room:", error.message);
        return callback({ success: false, message: "Unable to join meeting" });
      }
    });

    const forwardSignal = (incomingEvent, outgoingEvent) => {
      socket.on(incomingEvent, (data = {}, callback = noop) => {
        const meetingId = socket.data.meetingId;
        const target = io.sockets.sockets.get(data.toSocketId);

        if (!meetingId || !target || target.data.meetingId !== meetingId) {
          return callback({ success: false, message: "Invalid signaling target" });
        }

        target.emit(outgoingEvent, {
          ...data,
          fromSocketId: socket.id,
          fromUser: socket.data.user,
        });
        return callback({ success: true });
      });
    };

    forwardSignal("signal-offer", "signal-offer");
    forwardSignal("signal-answer", "signal-answer");
    forwardSignal("signal-ice", "signal-ice");

    socket.on("host-end-meeting", async (data = {}, callback = noop) => {
      const meetingId = normalizeMeetingId(data.meetingId);

      try {
        if (!isInMeeting(meetingId) || !socket.data.identity.id) {
          return callback({ success: false, message: "Not authorized" });
        }

        const meeting = await Meeting.findOne({ meetingId, isActive: true });
        if (!meeting || !isMeetingHost(meeting.hostId, socket.data.identity.id)) {
          return callback({ success: false, message: "Only the host can end this meeting" });
        }

        meeting.isActive = false;
        meeting.endTime = new Date();
        await meeting.save();

        io.to(meetingId).emit("meeting-ended", {
          message: "The host ended the meeting",
        });
        return callback({ success: true });
      } catch (error) {
        console.error("Unable to end meeting:", error.message);
        return callback({ success: false, message: "Unable to end meeting" });
      }
    });

    socket.on("user-leaving", async (_data = {}, callback = noop) => {
      try {
        await leaveCurrentMeeting();
        return callback({ success: true });
      } catch (error) {
        console.error("Unable to leave meeting:", error.message);
        return callback({ success: false, message: "Unable to leave meeting" });
      }
    });

    socket.on("send-chat-message", async (data = {}, callback = noop) => {
      const meetingId = normalizeMeetingId(data.meetingId);
      const message = String(data.message || "").trim();

      if (!isInMeeting(meetingId) || !message || message.length > 1000) {
        return callback({ success: false, message: "Invalid chat message" });
      }

      try {
        const chatMessage = await ChatMessage.create({
          meetingId,
          senderId: socket.data.identity.id,
          senderName: socket.data.user.name,
          senderIsHost: socket.data.user.isHost,
          message,
          timestamp: new Date(),
        });

        io.to(meetingId).emit("receive-chat-message", {
          _id: chatMessage._id,
          meetingId,
          sender: socket.data.user,
          message,
          timestamp: chatMessage.timestamp,
        });
        return callback({ success: true });
      } catch (error) {
        console.error("Unable to send chat message:", error.message);
        return callback({ success: false, message: "Unable to send message" });
      }
    });

    socket.on("get-chat-history", async (data = {}, callback = noop) => {
      const meetingId = normalizeMeetingId(data.meetingId);
      if (!isInMeeting(meetingId)) {
        return callback({ success: false, message: "Not authorized" });
      }

      try {
        const messages = await ChatMessage.find({ meetingId })
          .sort({ timestamp: 1 })
          .limit(100)
          .lean();
        socket.emit("chat-history", {
          meetingId,
          messages: messages.map(formatChatMessage),
        });
        return callback({ success: true });
      } catch (error) {
        console.error("Unable to load chat history:", error.message);
        return callback({ success: false, message: "Unable to load chat" });
      }
    });

    const forwardRoomEvent = (incomingEvent, outgoingEvent) => {
      socket.on(incomingEvent, (data = {}, callback = noop) => {
        const meetingId = normalizeMeetingId(data.meetingId);
        if (!isInMeeting(meetingId)) {
          return callback({ success: false, message: "Not authorized" });
        }

        socket.to(meetingId).emit(outgoingEvent, {
          user: socket.data.user,
          socketId: socket.id,
        });
        return callback({ success: true });
      });
    };

    forwardRoomEvent("start-screen-share", "screen-share-started");
    forwardRoomEvent("stop-screen-share", "screen-share-stopped");

    socket.on("disconnecting", () => {
      const meetingId = socket.data.meetingId;
      if (!meetingId) return;

      socket.to(meetingId).emit("user-left", { socketId: socket.id });
      markParticipantLeft(meetingId).catch((error) => {
        console.error("Unable to record participant disconnect:", error.message);
      });
    });
  });
};
