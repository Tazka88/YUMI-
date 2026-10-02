const express = require('express');
const fs = require('fs');

async function run() {
  try {
    const { setupApp } = require('./server.ts'); // we don't have setupApp exported, the server.ts just does app.listen
  } catch (err) {
    console.error(err);
  }
}
run();
