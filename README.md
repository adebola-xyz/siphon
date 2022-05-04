<p align=center>
  <img width=200 height=200 src="./img/siphon_proto.png"></img>
  <p align=center>
  <a href="https://www.npmjs.com/package/siphon-cli">
    <img src="https://img.shields.io/npm/v/siphon-cli.svg" alt="npm version" >
  </a>
  <a href="https://packagephobia.now.sh/result?p=siphon-cli">
    <img src="https://packagephobia.now.sh/badge?p=siphon-cli" alt="install size" >
  </a>
  <a href="https://github.com/adebola-xyz/siphon/blob/master/LICENSE.txt">
    <img src="https://img.shields.io/npm/l/siphon-cli.svg" alt="license">
  </a>
  </p>
</p>

<h1 align=center> Siphon </h1>

**Siphon is still in an early stage of development.**

## Overview

Siphon is a simple web bundler that reads HTML documents and resolves their assets into fewer files for production.

It can also format and minify your source code.

---

## Quick Start

To get started, install Siphon with the node command:

```console
npm install -g siphon-cli
```

Once it is installed, you can cd into a project folder with an `index.html` file and run the command:

```console
siphon-cli bundle index.html
```

This command will read the file, determine all its required assets, and bundle them up into an `index.html` file in a `build` folder.

---

## Watch Mode

Running Siphon in watch mode will set it to automatically bundle up your project whenever changes are made to the base file or its assets.

**By default, Siphon assumes your base file is src/index.html, and all your assets are stored in the src folder.**

To run Siphon in watch mode, cd to the root of your project and run the command:

```console
siphon-cli bundle --watch
```

---

## Configuration

You can reconfigure the behavior of the bundler by including a `siphon.config.js` file in the root of your project.

For example, to change the output directory, create the config file and add:

```js
module.exports = {
  outDir: "./dist",
};
```

When the bundler is run, it will bundle files into a `dist` folder, rather than the default `build`.

For more on configuration, see [Siphon Configs](CONFIG.md).
