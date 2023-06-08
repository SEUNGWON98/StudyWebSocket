import livereload from "livereload";
import livereloadMiddleware from "connect-livereload";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
// import WebSocket from "ws";

const liveServer = livereload.createServer({
  exts: ["js", "pug", "css"],
  delay: 1000,
});
liveServer.watch(__dirname);

const app = express();

app.use(livereloadMiddleware());

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});
instrument(wsServer, {
  auth: false,
});

function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

function countRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (backendsocket) => {
  backendsocket["name"] = "Noname";
  backendsocket.onAny((event) => {
    console.log(`Socket Event:${event}`);
  });
  backendsocket.on("enter_room", (roomName, done) => {
    backendsocket.join(roomName);
    done();
    backendsocket
      .to(roomName)
      .emit("welcome", backendsocket.name, countRoom(roomName));
    wsServer.sockets.emit("room_change", publicRooms());
  });
  backendsocket.on("disconnecting", () => {
    backendsocket.rooms.forEach((room) =>
      backendsocket
        .to(room)
        .emit("bye", backendsocket.name, countRoom(room) - 1)
    );
  });
  backendsocket.on("disconnect", () => {
    wsServer.sockets.emit("room_change", publicRooms());
  });
  backendsocket.on("new_message", (msg, room, done) => {
    backendsocket.to(room).emit("new_message", `${backendsocket.name}: ${msg}`);
    done();
  });
  backendsocket.on("name", (name) => (backendsocket["name"] = name));
});

const handleListen = () => console.log(`Listening on http://localhost:3000`);

httpServer.listen(3000, handleListen);

function onSocketClose() {
  console.log("Disconnected from the Server");
}
