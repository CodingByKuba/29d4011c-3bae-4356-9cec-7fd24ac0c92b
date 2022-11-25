const express = require("express");
const app = express();
const cors = require("cors");

const server = require("http").createServer(app);
const io = require("socket.io")(server, { cors: { origin: `*` } });

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const Room = require("./class/Room");
var rooms = require("./data/rooms");
const config = require("./config");

const PORT = process.env.PORT || 4000;

app.get("/", (req, res) => res.send({ server: true }));
app.get("/version", (req, res) => res.send({ version: config.APP_VERSION }));

app.post("/room", (req, res) => {
  try {
    if (!req.body.id) throw "Brak ID gracza";
    if (!req.body.roomId) throw "Brak ID pokoju";
    if (!req.body.nick) throw "Nie podano nicku";
    if (!req.body.appVersion) throw "Nie podano wersji aplikacji";
    if (req.body.appVersion != config.APP_VERSION)
      throw "Wersja Twojej aplikacji jest nieaktualna";
    if (!req.body.pointsSet || req.body.pointsSet.length !== 10)
      throw "Nie podano punktacji";
    if (req.body.startFromCard) {
      if (
        isNaN(req.body.startFromCard) ||
        parseInt(req.body.startFromCard) < 0 ||
        parseInt(req.body.startFromCard) > 7
      )
        throw "Nieprawidłowa karta rozpoczynająca";
    }
    let find = rooms.findIndex(
      (el) => el.id.toString() == req.body.roomId.toString()
    );
    if (find !== -1) {
      if (rooms[find].roomDestroyed === false) throw "Taki pokój już istnieje";
      if (rooms[find].roomDestroyed === true) {
        rooms = rooms.filter(
          (el) => el.id.toString() != req.body.roomId.toString()
        );
      }
    }

    let newPointsSet = [];
    req.body.pointsSet.map((el) => {
      if (!el) return newPointsSet.push(0);
      newPointsSet.push(parseInt(el));
    });
    let room = new Room({
      id: req.body.roomId.toString(),
      roomOwner: req.body.nick,
      maxPlayers: 6,
      playerId: req.body.id,
      startFromCard: req.body.startFromCard || 0,
      pointsSet: newPointsSet || [],
    });
    rooms.push(room);
    res.send(room);
  } catch (error) {
    return res.send({ error: error });
  }
});

app.put("/room", (req, res) => {
  try {
    if (!req.body.id) throw "Brak ID gracza";
    if (!req.body.roomId) throw "Brak ID pokoju";
    if (!req.body.nick) throw "Nie podano nicku";
    if (!req.body.appVersion) throw "Nie podano wersji aplikacji";
    if (req.body.appVersion != config.APP_VERSION)
      throw "Wersja Twojej aplikacji jest nieaktualna";
    let find = rooms.findIndex((el) => el.id == req.body.roomId);
    if (find === -1) throw "Nie znaleziono pokoju";
    if (rooms[find].roomDestroyed === true)
      throw "Ten pokój jest już nieaktywny";

    let result = rooms[find].addPlayerToRoom({
      id: req.body.id,
      nick: req.body.nick,
    });
    if (result.error) throw result.error;
    res.send(rooms[find].getRoomInfo());
  } catch (error) {
    return res.send({ error: error });
  }
});

server.listen(PORT, () => console.log("Server is running. PORT: " + PORT));

io.on("connection", (socket) => {
  if (config.DEBUG_MODE)
    console.log("Połączony użytkownik: " + socket.handshake.query.nick);

  let find = rooms.findIndex((el) => el.id == socket.handshake.query.roomId);
  if (find !== -1) {
    socket.join(socket.handshake.query.id.toString());
    io.to(socket.handshake.query.roomId.toString()).emit(
      "server-toast-notification",
      socket.handshake.query.nick + " dołączył do pokoju"
    );
    io.to(socket.handshake.query.roomId.toString()).emit(
      "server-update-room",
      rooms[find].getRoomInfo()
    );
    socket.join(socket.handshake.query.roomId.toString());
  }

  socket.on("client-switch-ready", () => {
    let result = rooms[find].switchPlayerReadyBeforeGame(
      socket.handshake.query.id
    );
    if (result.error)
      return socket.emit("server-toast-notification", result.error);
    io.to(socket.handshake.query.roomId.toString()).emit(
      "server-update-room",
      rooms[find].getRoomInfo()
    );
  });

  socket.on("client-start-game", () => {
    let result = rooms[find].startGameAsRoomOwner(socket.handshake.query.id);
    if (result.error)
      return socket.emit("server-toast-notification", result.error);
    io.to(socket.handshake.query.roomId.toString()).emit(
      "server-update-room",
      rooms[find].getRoomInfo()
    );
  });

  socket.on("client-stop-game", () => {
    let result = rooms[find].stopGameAsRoomOwner(socket.handshake.query.id);
    if (result.error)
      return socket.emit("server-toast-notification", result.error);
    io.to(socket.handshake.query.roomId.toString()).emit(
      "server-update-room",
      rooms[find].getRoomInfo()
    );
  });

  socket.on("client-start-round", () => {
    let result = rooms[find].startRound();
    if (result.error)
      return socket.emit("server-toast-notification", result.error);
    io.to(socket.handshake.query.roomId.toString()).emit(
      "server-update-room",
      rooms[find].getRoomInfo()
    );
  });

  socket.on("client-swipe-cards", (cards) => {
    let result = rooms[find].playerSwipeCards(socket.handshake.query.id, cards);
    if (result.error)
      return socket.emit("server-toast-notification", result.error);
    io.to(socket.handshake.query.roomId.toString()).emit(
      "server-update-room",
      rooms[find].getRoomInfo()
    );
    let players = [];
    rooms[find].players.map((el) => {
      if (el.id == socket.handshake.query.id) return;
      players.push(el.id);
    });
    io.to(players).emit(
      "server-toast-notification",
      cards.length > 0
        ? socket.handshake.query.nick + " wymienia karty - " + cards.length
        : socket.handshake.query.nick + " nie wymienia kart"
    );
  });

  socket.on("client-finish-round", () => {
    let result = rooms[find].finishRound();
    if (result.error)
      return socket.emit("server-toast-notification", result.error);
    io.to(socket.handshake.query.roomId.toString()).emit(
      "server-update-room",
      rooms[find].getRoomInfo()
    );
  });

  //DISCONNECT
  socket.on("disconnect", () => {
    let find = rooms.findIndex((el) => el.id == socket.handshake.query.roomId);
    try {
      if (find === -1)
        throw (
          "Próba opuszczenia pokoju przez gracza " +
          socket.handshake.query.nick +
          " zakończona niepowodzeniem"
        );
      let deletePlayer = rooms[find].leaveRoom(
        socket.handshake.query.id.toString()
      );
      if (deletePlayer.error) throw deletePlayer.error;
      io.to(socket.handshake.query.roomId.toString()).emit(
        "server-toast-notification",
        socket.handshake.query.nick + " utracił połączenie z pokojem"
      );
      io.to(socket.handshake.query.roomId.toString()).emit(
        "server-update-room",
        rooms[find].getRoomInfo()
      );
    } catch (error) {
      if (config.DEBUG_MODE) console.log(error);
    }

    if (config.DEBUG_MODE)
      console.log(socket.handshake.query.nick + " zakończył połączenie");
  });
});
