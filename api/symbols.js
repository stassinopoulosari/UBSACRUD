import * as db from "./db.js";

const symbolRegex = /\$\(((_|-|[0-9a-zA-Z])*)\)/,
  symbolRegexGlobal = new RegExp(symbolRegex.source, "g");

export const getSymbols = (instanceRef) =>
    new Promise((resolve, reject) =>
      db
        .quickGet(db.child(instanceRef, "symbols"))
        .then((symbolsSnapshot) => resolve(symbolsSnapshot.val()))
        .catch(reject),
    ),
  setSymbolDefaultValue = (instanceRef, symbolKey, newValue) =>
    db.update(db.child(instanceRef, `symbols/${symbolKey}`), {
      value: newValue,
    }),
  createSymbol = (instanceRef, value) =>
    db.push(db.child(instanceRef, "symbols"), {
      configurable: false,
      value: value,
    }),
  getNewSymbolKey = (instanceRef) =>
    db.push(db.child(instanceRef, "symbols")).key,
  createSymbolWithKey = (instanceRef, symbolKey, value) =>
    db.set(db.child(instanceRef, `symbols/${symbolKey}`), {
      configurable: false,
      value: value,
    }),
  setSymbolIsConfigurable = (instanceRef, symbolKey, isConfigurable) =>
    db.update(db.child(instanceRef, `symbols/${symbolKey}`), {
      configurable: isConfigurable,
    }),
  deleteSymbol = (instanceRef, symbolKey) =>
    db.set(db.child(instanceRef, `symbols/${symbolKey}`), null),
  renderSymbols = (symbols, str) => {
    let workingStr = str;
    while (workingStr.match(symbolRegex)) {
      const match = workingStr.match(symbolRegex);
      const fullMatch = match[0],
        matchIndex = match.index,
        symbolKey = match[1];
      if (Object.hasOwn(symbols, symbolKey)) {
        const symbolValue = symbols[symbolKey].value;
        workingStr =
          workingStr.slice(0, matchIndex) +
          symbolValue +
          workingStr.slice(matchIndex + fullMatch.length);
      }
    }
    return workingStr;
  },
  stringToSymbolValueList = (symbols, str) =>
    [...str.matchAll(symbolRegexGlobal)].map(
      (match) => (symbols[match[1]] ?? { value: "[unknown]" }).value,
    );
