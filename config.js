module.exports = {
  //Wersja aplikacji
  APP_VERSION: "1.0.0",

  //console logi
  DEBUG_MODE: true,

  //Minimalna ilość graczy w pokoju:
  MIN_PLAYERS: 2,

  //Maksymalna ilość graczy w pokoju:
  MAX_PLAYERS: 6,

  //Standardowa punktacja
  DEFAULT_POINTS_SET: [
    1, //Wysoka karta
    2, //Para
    4, //Dwie pary
    5, //Trójka
    8, //Strit
    15, //Kolor
    20, //Full
    30, //Kareta
    50, //Poker
    200,
  ], //Poker królewski
};
