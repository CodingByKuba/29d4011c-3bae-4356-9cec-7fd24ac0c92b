class CardSet {
  constructor(data) {
    this.startFromCard =
      data.startFromCard >= 0 && data.startFromCard < 8
        ? data.startFromCard
        : 0;

    this.heartCards = [
      "02-H",
      "03-H",
      "04-H",
      "05-H",
      "06-H",
      "07-H",
      "08-H",
      "09-H",
      "10-H",
      "11-H",
      "12-H",
      "13-H",
      "14-H",
    ].slice(this.startFromCard);

    this.diamondCards = [
      "02-D",
      "03-D",
      "04-D",
      "05-D",
      "06-D",
      "07-D",
      "08-D",
      "09-D",
      "10-D",
      "11-D",
      "12-D",
      "13-D",
      "14-D",
    ].slice(this.startFromCard);

    this.clubCards = [
      "02-C",
      "03-C",
      "04-C",
      "05-C",
      "06-C",
      "07-C",
      "08-C",
      "09-C",
      "10-C",
      "11-C",
      "12-C",
      "13-C",
      "14-C",
    ].slice(this.startFromCard);

    this.spadeCards = [
      "02-S",
      "03-S",
      "04-S",
      "05-S",
      "06-S",
      "07-S",
      "08-S",
      "09-S",
      "10-S",
      "11-S",
      "12-S",
      "13-S",
      "14-S",
    ].slice(this.startFromCard);

    this.allCards = this.heartCards.concat(
      this.diamondCards.concat(this.clubCards.concat(this.spadeCards))
    );
  }

  getAllCards() {
    return this.allCards;
  }

  getShuffledCards() {
    return this.allCards.sort(() => (Math.random() > 0.5 ? 1 : -1));
  }
}

module.exports = CardSet;
