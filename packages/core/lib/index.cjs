"use strict";

const { resolve } = require("node:path");

const runtimekitPath = resolve(__dirname, "..", "dist");

exports.runtimekitPath = runtimekitPath;
