#!/usr/bin/env node
import { runCli } from '../src/cli/index.js';

runCli(process.argv.slice(2)).catch((err) => {
  console.error('Error:', err.message || err);
  process.exit(1);
});
