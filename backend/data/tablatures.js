'use strict';

const tablatures = [];
let nextId = 1;

function getNextId() {
  return nextId++;
}

module.exports = { tablatures, getNextId };
