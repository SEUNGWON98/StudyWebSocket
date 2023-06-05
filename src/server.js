import livereload from "livereload";
import livereloadMiddleware from "connect-livereload";
import express from "express";
import http from "http";
import WebSocket from "ws";

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

const handleListen = () => console.log(`Listening on http://localhost:3000`);

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

function onSocketClose() {
  console.log("Disconnected from the Server");
}

const sockets = [];

wss.on("connection", (backendsocket) => {
  sockets.push(backendsocket);
  backendsocket["nickname"] = "Noname";
  console.log("Connected Server");

  backendsocket.on("close", onSocketClose);
  backendsocket.on("message", (msg) => {
    const message = JSON.parse(msg);
    switch (message.type) {
      case "new_message":
        sockets.forEach((aSocket) =>
          aSocket.send(`${backendsocket.nickname}:${message.payload}`)
        );
        break;
      case "nickname":
        backendsocket["nickname"] = message.payload;
        break;
    }
  });
});

server.listen(3000, handleListen);

{
  type: "message";
  payload: "hello everyone!";
}

{
  type: "nickname";
  payload: "Seo";
}
