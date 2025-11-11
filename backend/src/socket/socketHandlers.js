const Meeting = require("../models/Meeting");
const ChatMessage = require('../models/ChatMessage');

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", async (data) => {
      const { meetingId, user } = data;
      console.log(
        `User ${user.name} (${socket.id}) joining room: ${meetingId}`
      );

      try {
        // Get meeting to check if user is host
        const meeting = await Meeting.findOne({ meetingId });
        let isHost = false;

        if (meeting && user.id) {
          isHost = meeting.hostId.toString() === user.id;
          console.log(
            `👑 Host check: ${user.name} is ${isHost ? "HOST" : "participant"}`
          );
        }

        // Join the room
        socket.join(meetingId);

        // Notify others in the room (except the sender) with host status
        socket.to(meetingId).emit("user-joined", {
          user: {
            ...user,
            isHost: isHost,
          },
          socketId: socket.id,
        });

        // Send current participants to the new user
        const room = io.sockets.adapter.rooms.get(meetingId);
        if (room) {
          const participants = Array.from(room).filter(
            (id) => id !== socket.id
          );
          // In a real app, you'd send actual user data from stored participants
          participants.forEach((participantId) => {
            // For existing participants, we don't know their host status in this simple implementation
            socket.emit("user-joined", {
              user: {
                name: "Existing Participant",
                isHost: false, // Default to false for existing participants
              },
              socketId: participantId,
            });
          });
        }

        console.log(
          `✅ ${user.name} ${
            isHost ? "(Host 👑)" : ""
          } joined room ${meetingId}`
        );
      } catch (error) {
        console.error("Error handling join-room:", error);
      }
    });

    // WebRTC signaling handlers
    socket.on("signal-offer", (data) => {
      console.log("📤 Forwarding offer from", socket.id, "to", data.toSocketId);
      socket.to(data.toSocketId).emit("signal-offer", {
        ...data,
        fromSocketId: socket.id,
      });
    });

    socket.on("signal-answer", (data) => {
      console.log(
        "📥 Forwarding answer from",
        socket.id,
        "to",
        data.toSocketId
      );
      socket.to(data.toSocketId).emit("signal-answer", {
        ...data,
        fromSocketId: socket.id,
      });
    });

    socket.on("signal-ice", (data) => {
      console.log(
        "🧊 Forwarding ICE candidate from",
        socket.id,
        "to",
        data.toSocketId
      );
      socket.to(data.toSocketId).emit("signal-ice", {
        ...data,
        fromSocketId: socket.id,
      });
    });

    // Host controls
    socket.on("host-end-meeting", async (data) => {
      const { meetingId } = data;
      console.log("👑 Host ending meeting:", meetingId);

      try {
        // Update meeting in database
        await Meeting.findOneAndUpdate(
          { meetingId },
          {
            isActive: false,
            endTime: new Date(),
          }
        );

        // Notify all participants in the room
        io.to(meetingId).emit("meeting-ended", {
          message: "Host has ended the meeting",
        });

        console.log(`✅ Meeting ${meetingId} ended by host`);
      } catch (error) {
        console.error("Error ending meeting:", error);
      }
    });

    socket.on("user-leaving", async (data) => {
      const { meetingId, userId } = data;
      console.log("User leaving meeting:", meetingId, "socket:", socket.id);

      try {
        // Update participant leftAt time
        if (userId) {
          await Meeting.findOneAndUpdate(
            { meetingId, "participants.socketId": socket.id },
            {
              $set: {
                "participants.$.leftAt": new Date(),
              },
            }
          );
        }

        // Notify others in the room
        socket.to(meetingId).emit("user-left", {
          user: { name: "Participant" },
          socketId: socket.id,
        });
      } catch (error) {
        console.error("Error updating participant leave time:", error);
      }
    });

     // Chat functionality
    socket.on('send-chat-message', async (data) => {
      const { meetingId, sender, message } = data;
      console.log('💬 Chat message from:', sender.name, 'in meeting:', meetingId);

      try {
        // Save message to database
        const chatMessage = new ChatMessage({
          meetingId,
          senderId: sender.id || null,
          senderName: sender.name,
          message,
          timestamp: new Date()
        });

        await chatMessage.save();

        // Broadcast to all in the meeting room
        io.to(meetingId).emit('receive-chat-message', {
          _id: chatMessage._id,
          meetingId,
          sender,
          message,
          timestamp: chatMessage.timestamp
        });

      } catch (error) {
        console.error('Error saving chat message:', error);
      }
    });

    // Get chat history
    socket.on('get-chat-history', async (data) => {
      const { meetingId } = data;
      console.log('📜 Getting chat history for meeting:', meetingId);

      try {
        const messages = await ChatMessage.find({ meetingId })
          .sort({ timestamp: 1 })
          .limit(100)
          .lean();

        socket.emit('chat-history', {
          meetingId,
          messages
        });
      } catch (error) {
        console.error('Error fetching chat history:', error);
      }
    });

    // Screen sharing handlers
    socket.on('start-screen-share', (data) => {
      const { meetingId, user } = data;
      console.log('🖥️ Screen share started by:', user.name, 'in meeting:', meetingId);

      // Notify all other participants
      socket.to(meetingId).emit('screen-share-started', {
        user,
        socketId: socket.id
      });
    });

    socket.on('stop-screen-share', (data) => {
      const { meetingId, user } = data;
      console.log('🖥️ Screen share stopped by:', user.name, 'in meeting:', meetingId);

      // Notify all other participants
      socket.to(meetingId).emit('screen-share-stopped', {
        user,
        socketId: socket.id
      });
    });

    socket.on("disconnect", async () => {
      console.log("User disconnected:", socket.id);

      try {
        // Update participant leftAt time for all rooms user was in
        const rooms = Array.from(socket.rooms).filter(
          (room) => room !== socket.id
        );

        for (const room of rooms) {
          await Meeting.findOneAndUpdate(
            { meetingId: room, "participants.socketId": socket.id },
            {
              $set: {
                "participants.$.leftAt": new Date(),
              },
            }
          );

          // Notify room members
          socket.to(room).emit("user-left", {
            user: { name: "Participant" },
            socketId: socket.id,
          });
        }
      } catch (error) {
        console.error("Error handling disconnect:", error);
      }
    });
  });
};
