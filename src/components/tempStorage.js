// tempStorage.js
let tempStorage = {};

export const setTempStorage = (key, value) => {
  tempStorage[key] = value;
};

export const getTempStorage = (key) => {
  return tempStorage[key];
};

export const clearTempStorage = () => {
  tempStorage = {};
};
