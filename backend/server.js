const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const callRoutes = require("./routes/callRoute");

const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const path = require("path");
const cors = require('cors');

dotenv.config();
connectDB();
const app = express();
app.use(cors())
app.use(express.json());

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/call", callRoutes);




const socketsStatus = {};
// --------------------------deployment------------------------------
// const __dirname1 = path.resolve();
// if (process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname1, "/frontend/build")));
//   app.get("*", (req, res) =>
//     res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
//   );
// } else {
//   app.get("/", (req, res) => {
//     res.send("API is running..");
//   });
// }
// // --------------------------deployment------------------------------
// // Error Handling middlewares
// app.use(notFound);
// app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const server = app.listen(
  PORT,
  console.log(`Server running on PORT ${PORT}...`)
);

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "*",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io", socket.id);
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });
  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });
  socket.on("typing", (room) => socket.in(room).emit("typing"));

  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;
    if (!chat.users) return console.log("chat.users not defined");
    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;
      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });
  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });

  // ------------------------------------------------------------
  const socketId = socket.id;
  socketsStatus[socket.id] = {};

  // socket.on("voice", function (data) {
  //   var newData = data.base64String.split(";");
  //   newData[0] = "data:audio/ogg;";
  //   newData = newData[0] + newData[1];
  //   var chat = data.selectedChat;

  //   if (!chat.users) return console.log("chat.users not defined");
  //   chat.users.forEach((user) => {
  //     if (user._id == data.loginUserId) { return }
  //     else {
  //       for (const id in socketsStatus) {
  //         if (id != socketId && !socketsStatus[id].mute && socketsStatus[id].online && user._id == data.data.sender._id)
  //           console.log("emit data ====", data,)
  //         socket.broadcast.to(id).emit("send", newData);
  //       }
  //       // socket.in(user._id).emit("call recieved", data.data);
  //     };
  //   });
  // });

  // socket.on("voice", function (data) {
  //   var newData = data.base64String.split(";");
  //   newData[0] = "data:audio/ogg;";
  //   newData = newData[0] + newData[1];
  //   var callChat = data.data.chat;
  //   if (!callChat.users) return console.log("chat.users not defined");
  //   callChat.users.forEach((user) => {
  //     if (user._id == data.data.sender._id) { return }
  //     else {
  //       for (const id in socketsStatus) {
  //         if (id != socketId && !socketsStatus[id].mute && socketsStatus[id].online && user._id == data.data.sender._id)
  //           socket.broadcast.to(id).emit("send", newData);
  //       }
  //       socket.in(user._id).emit("call recieved", data.data);
  //     };
  //   });
  // });

  socket.on("userInformation", function (data) {
    socketsStatus[socketId] = data;
    io.sockets.emit("usersUpdate", socketsStatus);
  });

  socket.on("disconnect", function () {
    delete socketsStatus[socketId];
  });
  //------------------------------------------- calling alert -------------------------------------------------

  socket.emit("me", socket.id);

  socket.on("callUser", ({ userToCall, signalData, from, name, callData }) => {
    io.to(userToCall).emit("callUser", { signal: signalData, from, name, callData });
    console.log("calldata ==", callData)
   
      var chat = callData.chat;
      if (!chat.users) return console.log("chat.users not defined");
      else {
        chat.users.forEach((user) => {
          if (user._id == callData.sender._id) return;
          socket.in(user._id).emit("call alert", callData);
        });
      }
  });

  // -------voice call --------------------------------------
  socket.on("voice", function (data) {
    console.log("------------",data)
    var newData = data.split(";");
    // var newData = data.base64String.split(";");
    newData[0] = "data:audio/ogg;";
    newData = newData[0] + newData[1];
    for (const id in socketsStatus) {
      if (id != socketId && !socketsStatus[id].mute && socketsStatus[id].online)
        socket.broadcast.to(id).emit("send", newData);
    }

  });

  // -----------------------------------
  socket.on("updateMyMedia", ({ type, currentMediaStatus }) => {
    socket.broadcast.emit("updateUserMedia", { type, currentMediaStatus });
  });

  socket.on("msgUser", ({ name, to, msg, sender }) => {
    io.to(to).emit("msgRcv", { name, msg, sender });
  });

  socket.on("answerCall", (data) => {
    socket.broadcast.emit("updateUserMedia", {
      type: data.type,
      currentMediaStatus: data.myMediaStatus,
    });
    io.to(data.to).emit("callAccepted", data);
  });

  socket.on("endCall", ({ id }) => {
    io.to(id).emit("endCall");
  });
});
