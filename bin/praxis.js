#!/usr/bin/env node
import { runCli } from '../src/cli/index.js';

runCli(process.argv.slice(2))
  .then((code) => {
    if (typeof code === 'number' && code !== 0) {
      process.exitCode = code;
    }
  })
  .catch((err) => {
    console.error('Error:', err.message || err);
    process.exitCode = 1;
  });
