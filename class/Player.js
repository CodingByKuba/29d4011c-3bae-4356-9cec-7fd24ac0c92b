const config = require("../config");

class Player {
  constructor(data) {
    this.id = data.id || "";
    this.nick = data.nick || "?";
    this.cards = [];
    this.cardsChanged = false;
    this.turn = false;
    this.points = 0;
    this.additionalPoints = 0;
    this.cardSetType = "";
    this.pointsSet = data.pointsSet || config.DEFAULT_POINTS_SET;
    this.ready = false;
  }

  roundResetPlayer() {
    this.cards = [];
    this.cardsChanged = false;
    this.turn = false;
    this.additionalPoints = 0;
    this.cardSetType = "";
  }

  resetPlayer() {
    this.cards = [];
    this.cardsChanged = false;
    this.turn = false;
    this.points = 0;
    this.additionalPoints = 0;
    this.cardSetType = "";
  }

  setCardsChanged(boolean) {
    if (boolean === true) {
      this.cardsChanged = true;
      return true;
    } else {
      this.cardsChanged = false;
      return false;
    }
  }

  setTurn(boolean) {
    if (boolean === true) {
      this.turn = true;
      return true;
    } else {
      this.turn = false;
      return false;
    }
  }

  addPoints(points) {
    if (isNaN(points)) return false;
    this.points += points;
    return true;
  }

  addAdditionalPoints(points) {
    if (isNaN(points)) return false;
    this.additionalPoints += points;
    return true;
  }

  switchReady() {
    if (this.ready == true) {
      this.ready = false;
      return;
    }
    this.ready = true;
  }

  sortCards() {
    return (this.cards = this.cards.sort());
  }

  setCardSetType() {
    try {
      let type = this.getCardSetType();
      if (type.error) throw type.error;
      this.cardSetType = type.type;
      this.addAdditionalPoints(type.points);
      this.addPoints(type.points);
      return type;
    } catch (error) {
      if (error) return { error: error };
    }
  }

  getCardSetType() {
    try {
      let finalObject = {
        type: "WYSOKA KARTA",
        points: this.pointsSet[0] || 0,
      };
      if (this.cards.length < 5) throw "Brak odpowiedniej ilości kart";

      let numberArray = [];
      let symbolArray = [];
      this.cards.map((el) => {
        numberArray.push(el.slice(0, 2));
        symbolArray.push(el.slice(3, 4));
      });

      //KOLOR, POKER, POKER KRÓLEWSKI
      if (
        symbolArray[0] == symbolArray[1] &&
        symbolArray[1] == symbolArray[2] &&
        symbolArray[2] == symbolArray[3] &&
        symbolArray[3] == symbolArray[4]
      ) {
        let parseArray = [];
        numberArray.map((el) => parseArray.push(parseInt(el)));
        parseArray.sort((a, b) => a - b);
        if (
          parseArray[0] + 1 == parseArray[1] &&
          parseArray[1] + 1 == parseArray[2] &&
          parseArray[2] + 1 == parseArray[3] &&
          parseArray[3] + 1 == parseArray[4]
        ) {
          if (parseArray[4] == 14) {
            finalObject.type = "POKER KRÓLEWSKI";
            finalObject.points = this.pointsSet[9] || 0;
            return finalObject;
          }
          finalObject.type = "POKER";
          finalObject.points = this.pointsSet[8] || 0;
          return finalObject;
        }
        finalObject.type = "KOLOR";
        finalObject.points = this.pointsSet[5] || 0;
        return finalObject;
      }

      //KARETA
      if (
        (numberArray[0] == numberArray[1] &&
          numberArray[1] == numberArray[2] &&
          numberArray[2] == numberArray[3]) ||
        (numberArray[1] == numberArray[2] &&
          numberArray[2] == numberArray[3] &&
          numberArray[3] == numberArray[4])
      ) {
        finalObject.type = "KARETA";
        finalObject.points = this.pointsSet[7] || 0;
        return finalObject;
      }

      //FUL
      if (
        (numberArray[0] == numberArray[1] &&
          numberArray[1] == numberArray[2] &&
          numberArray[3] == numberArray[4]) ||
        (numberArray[0] == numberArray[1] &&
          numberArray[2] == numberArray[3] &&
          numberArray[3] == numberArray[4])
      ) {
        finalObject.type = "FULL";
        finalObject.points = this.pointsSet[6] || 0;
        return finalObject;
      }

      //STRIT
      let parseArray = [];
      numberArray.map((el) => parseArray.push(parseInt(el)));
      parseArray.sort((a, b) => a - b);
      if (
        parseArray[0] + 1 == parseArray[1] &&
        parseArray[1] + 1 == parseArray[2] &&
        parseArray[2] + 1 == parseArray[3] &&
        parseArray[3] + 1 == parseArray[4]
      ) {
        finalObject.type = "STRIT";
        finalObject.points = this.pointsSet[4] || 0;
        return finalObject;
      }

      //TRÓJKA
      if (
        (numberArray[0] == numberArray[1] &&
          numberArray[1] == numberArray[2]) ||
        (numberArray[1] == numberArray[2] &&
          numberArray[2] == numberArray[3]) ||
        (numberArray[2] == numberArray[3] && numberArray[3] == numberArray[4])
      ) {
        finalObject.type = "TRÓJKA";
        finalObject.points = this.pointsSet[3] || 0;
        return finalObject;
      }

      //DWIE PARY
      if (
        (numberArray[0] == numberArray[1] &&
          numberArray[2] == numberArray[3]) ||
        (numberArray[0] == numberArray[1] &&
          numberArray[3] == numberArray[4]) ||
        (numberArray[1] == numberArray[2] && numberArray[3] == numberArray[4])
      ) {
        finalObject.type = "DWIE PARY";
        finalObject.points = this.pointsSet[2] || 0;
        return finalObject;
      }

      //PARA
      if (
        numberArray[0] == numberArray[1] ||
        numberArray[1] == numberArray[2] ||
        numberArray[2] == numberArray[3] ||
        numberArray[3] == numberArray[4]
      ) {
        finalObject.type = "PARA";
        finalObject.points = this.pointsSet[1] || 0;
        return finalObject;
      }

      return finalObject;
    } catch (error) {
      return { error: error };
    }
  }
}

module.exports = Player;
