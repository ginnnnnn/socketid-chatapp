const path = require("path");
//express
const express = require("express");
const app = express();
//socket io set up
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
//utils
const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");
//bad-word
const Filter = require("bad-words");
//PORT
const port = process.env.PORT || 3000;

//public path
const publicDirectory = path.join(__dirname, "../public");

//static
app.use(express.static(publicDirectory));

//io on
io.on("connection", (socket) => {
  console.log("new client connected");

  //
  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);
    //socket.emit io.emit socket.broadcast.emit
    //io.to(room).emit socket.broadcast.to(room).emit //to specific room
    socket.emit("message", generateMessage("system", "Welcome"));
    //broadcast.emit will notify all clients except the current client,io.emit will notify all clients
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessage("system", `${user.username} has joined`)
      );
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const filter = new Filter();
    const user = getUser(socket.id);
    if (!user) {
      return callback(`${user.username} not exist`);
    }

    if (filter.isProfane(message)) {
      return callback("bad words");
    }

    io.to(user.room).emit("message", generateMessage(user.username, message));
    //show acknowledge
    callback();
  });
  //
  socket.on("sendLocation", (data, callback) => {
    const { longitude, latitude } = data;
    const user = getUser(socket.id);
    if (!user) {
      return callback(`${user.username} not exist`);
    }
    const googleMapUrl = `https://www.google.com.tw/maps/?q=${latitude},${longitude}`;
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(user.username, googleMapUrl)
    );
    callback();
  });
  //
  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage("system", `${user.username} has left !`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
