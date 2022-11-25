const { v4: uuidv4 } = require("uuid");

const Player = require("./Player");
const CardSet = require("./CardSet");

const config = require("../config");

class Room {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.roomOwner = data.playerId || Math.random();
    this.startFromCard =
      data.startFromCard >= 0 && data.startFromCard < 8
        ? data.startFromCard
        : 0;
    this.pointsSet = data.pointsSet || config.DEFAULT_POINTS_SET;

    this.maxPlayers = Math.floor((47 - this.startFromCard * 4) / 5);

    this.players = [
      new Player({
        id: data.playerId || Math.random(),
        nick: data.roomOwner || "",
        pointsSet: this.pointsSet,
      }),
    ];
    this.cardSet = new CardSet({
      startFromCard: this.startFromCard,
    }).getShuffledCards();

    this.gameStarted = false;
    this.roundStarted = false;

    this.roundCount = 0;

    this.roomDestroyed = false;
    this.lastMovement = new Date();
  }

  getRoomInfo() {
    return {
      id: this.id,
      roomOwner: this.roomOwner,
      maxPlayers: this.maxPlayers,
      players: this.players,
      cardSet: this.cardSet.length,
      gameStarted: this.gameStarted,
      roundStarted: this.roundStarted,
      roundCount: this.roundCount,
    };
  }

  resetRoom() {
    this.cardSet = new CardSet({
      startFromCard: this.startFromCard,
    }).getShuffledCards();
    this.roundStarted = false;
    this.stopGame();
    this.roomDestroyed = false;
    this.roundCount = 0;
    this.players.map((el) => el.resetPlayer());
  }

  switchPlayerReadyBeforeGame(player) {
    try {
      if (this.gameStarted === true) throw "Gra się już rozpoczęła";
      let find = this.players.findIndex((el) => el.id === player);
      if (find == -1) throw "Nie znaleziono gracza";
      this.players[find].switchReady();
      return true;
    } catch (error) {
      return { error: error };
    } finally {
      this.lastMovement = new Date();
    }
  }

  startRound() {
    try {
      if (this.gameStarted !== true) throw "Gra jeszcze się nie rozpoczęła";
      if (this.roundStarted === true) throw "Runda już się rozpoczęła";
      if (this.players.length < 2) throw "Zbyt mało graczy w pokoju";
      this.roundStarted = true;
      this.cardSet = new CardSet({
        startFromCard: this.startFromCard,
      }).getShuffledCards();
      this.players.map((el) => {
        el.roundResetPlayer();
      });
      this.players[0].setTurn(true);
      this.pullCardsAtStart();
      this.roundCount++;
      return true;
    } catch (error) {
      return { error: error };
    } finally {
      this.lastMovement = new Date();
    }
  }

  setTurnForNextPlayer() {
    try {
      let find = this.players.findIndex((el) => el.turn === true);
      if (find === -1) throw "Nie znaleziono gracza";
      if (find === this.players.length - 1) {
        this.players[find].setTurn(false);
        return true;
      }
      this.players[find + 1].setTurn(true);
      this.players[find].setTurn(false);
      return true;
    } catch (error) {
      return { error: error };
    } finally {
      this.lastMovement = new Date();
    }
  }

  finishRound() {
    try {
      if (!this.roundStarted) throw "Runda nie wystartowała";
      if (this.players.filter((el) => el.turn === true).length > 0)
        throw "Runda nie jest skończona";
      this.roundStarted = false;
      this.players.map((el) => el.setCardSetType());
      return true;
    } catch (error) {
      return { error: error };
    } finally {
      this.lastMovement = new Date();
    }
  }

  addPlayerToRoom(user) {
    try {
      if (!user) throw "Nie podano danych gracza";
      if (!user.id) throw "Nie podano ID gracza";
      if (!user.nick) throw "Nie podano nicku gracza";
      if (this.gameStarted === true) throw "Gra już się rozpoczęła";
      if (this.players.findIndex((el) => el.id == user.id) !== -1)
        throw "Taki gracz już jest w pokoju";
      if (this.players.length >= this.maxPlayers)
        throw "W pokoju jest już maksymalna ilość graczy";
      this.players.push(
        new Player({
          id: user.id || uuidv4(),
          nick: user.nick || "?",
          pointsSet: this.pointsSet,
        })
      );
      if (this.players.length === this.maxPlayers) {
        this.startGame();
      }
      if (this.players.length == 1) this.roomOwner = user.id;
      return true;
    } catch (error) {
      return { error: error };
    } finally {
      this.lastMovement = new Date();
    }
  }

  leaveRoom(player) {
    try {
      if (!player) throw "Nie podano gracza";
      let findPlayer = this.players.findIndex((el) => el.id == player);
      if (findPlayer === -1) throw "Nie znaleziono gracza";
      if (this.players[findPlayer].turn === true) this.setTurnForNextPlayer();
      if (this.players[findPlayer].cards.length > 0) {
        this.players[findPlayer].cards.map((el) => {
          this.cardSet.push(el);
        });
        this.players[findPlayer].cards = [];
      }
      let newPlayers = this.players.filter((el) => el.id !== player);
      if (newPlayers.length == this.players.length)
        throw "Nie ma Cię w tym pokoju";
      let findOwner = newPlayers.findIndex((el) => el.id == this.roomOwner);
      if (newPlayers.length == 1) {
        this.resetRoom();
        newPlayers[0].resetPlayer();
      }
      if (newPlayers.length === 0) {
        this.resetRoom();
        this.roomOwner = "";
        this.roomDestroyed = true;
      }
      if (findOwner === -1 && newPlayers.length > 0) {
        this.roomOwner = newPlayers[0].id;
      }
      this.players = newPlayers;
      return true;
    } catch (error) {
      return { error: error };
    } finally {
      this.lastMovement = new Date();
    }
  }

  startGame() {
    this.gameStarted = true;
    this.lastMovement = new Date();
    return this.gameStarted;
  }

  startGameAsRoomOwner(player) {
    try {
      if (!player) throw "Nie podano gracza";
      let find = this.players.findIndex((el) => el.id == player);
      if (find === -1) throw "Nie znaleziono gracza";
      if (this.roomOwner !== this.players[find].id)
        throw "Nie jesteś właścicielem pokoju";
      if (this.gameStarted == true) throw "Gra już się rozpoczęła";
      let ready = this.players.filter((el) => el.ready == false);
      if (ready.length > 0) throw "Nie wszyscy gracze są gotowi do gry";
      this.gameStarted = true;
      this.players.map((el) => (el.ready = false));
      this.lastMovement = new Date();
      return this.gameStarted;
    } catch (error) {
      return { error: error };
    }
  }

  stopGame() {
    if (this.roundStarted === true) return this.gameStarted;
    this.gameStarted = false;
    this.lastMovement = new Date();
    return this.gameStarted;
  }

  stopGameAsRoomOwner(player) {
    try {
      if (!player) throw "Nie podano gracza";
      let find = this.players.findIndex((el) => el.id == player);
      if (find === -1) throw "Nie znaleziono gracza";
      if (this.roomOwner !== this.players[find].id)
        throw "Nie jesteś właścicielem pokoju";
      if (this.gameStarted == false) throw "Gra się nie rozpoczęła";
      if (this.roundStarted == true) throw "Runda nie jest skończona";
      this.resetRoom();
      return this.gameStarted;
    } catch (error) {
      return { error: error };
    }
  }

  destroyRoom() {
    this.roomDestroyed = true;
    this.lastMovement = new Date();
    return this.roomDestroyed;
  }

  shuffleCards() {
    this.lastMovement = new Date();
    return (this.cardSet = this.cardSet.sort(() =>
      Math.random() > 0.5 ? 1 : -1
    ));
  }

  playerTakeCard(player) {
    try {
      let findPlayer = this.players.findIndex((el) => el.id == player);
      if (findPlayer === -1) throw "Nie znaleziono gracza";
      if (this.cardSet.length < 1) throw "Brak kart w talii";
      if (this.players[findPlayer].cards.length >= 5)
        throw "Nie możesz pobrać więcej kart";
      this.players[findPlayer].cards.push(this.cardSet[0]);
      this.cardSet.shift();
      return true;
    } catch (error) {
      return { error: error };
    } finally {
      this.lastMovement = new Date();
    }
  }

  pullCardsAtStart() {
    for (let i = 0; i < 5; i++) {
      this.players.map((el) => this.playerTakeCard(el.id));
    }
    this.players.map((el) => this.playerSortCards(el.id));
    this.lastMovement = new Date();
  }

  playerSwipeCards(player, cardPosition) {
    try {
      if (!Array.isArray(cardPosition) || cardPosition.length > 5)
        throw "Nieprawidłowy format zaznaczonych kart";
      let findPlayer = this.players.findIndex((el) => el.id == player);
      if (findPlayer === -1) throw "Nie znaleziono gracza";
      if (this.players[findPlayer].turn !== true) throw "Nie jest Twoja kolej";
      if (this.players[findPlayer].cardsChanged === true)
        throw "Karty już były wymieniane";
      if (this.cardSet.length === 0) throw "Brak kart w talii";
      if (cardPosition.length == 0) {
        let setTurn = this.setTurnForNextPlayer();
        if (setTurn.error) throw setTurn.error;
        return true;
      }
      let swipedCardsArray = [];
      cardPosition.map((el) => {
        if (isNaN(el) || el < 0 || el > 4) throw "Nie znaleziono karty";
        if (swipedCardsArray.indexOf(el) !== -1)
          throw "Zaznaczone karty powtarzają się";
        swipedCardsArray.push(el);
      });
      let setTurn = this.setTurnForNextPlayer();
      if (setTurn.error) throw setTurn.error;
      cardPosition.map((el) => {
        let card = this.players[findPlayer].cards[el];
        this.players[findPlayer].cards[el] = this.cardSet[0];
        this.cardSet.shift();
        this.cardSet.push(card);
      });
      this.players[findPlayer].setCardsChanged(true);
      this.playerSortCards(player);
      return true;
    } catch (error) {
      return { error: error };
    } finally {
      this.lastMovement = new Date();
    }
  }

  playerSortCards(player) {
    try {
      let findPlayer = this.players.findIndex((el) => el.id == player);
      if (findPlayer === -1) throw "Nie znaleziono gracza";
      return this.players[findPlayer].sortCards();
    } catch (error) {
      return { error: error };
    } finally {
      this.lastMovement = new Date();
    }
  }
}

module.exports = Room;
