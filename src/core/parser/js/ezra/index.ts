// Ezra was written by Adebola Akomolafe and is available for use in Siphon under an MIT license.

import { PathLike } from "fs";
import { ezra_internals } from "./base.js";
import "./expressions.js";
import "./modules.js";
import "./group.js";
import "./reparse.js";
import "./statements.js";
import "./literals.js";
import "./utils.js";
import "./functions.js";
import "./classes.js";
import "./objects.js";
import "./identifiers.js";

interface options {
  sourceFile: PathLike;
}
var defaults: options = {
  sourceFile: "",
};
/**
 * Ezra is a simple Typescript-based JavaScript parser, and is one of the parsing engines that power Siphon.
 */
class Ezra {
  parse(input: string, options?: options) {
    options = { ...defaults, ...options };
    return new ezra_internals().parse(input);
  }
  /**
   * Ezra's single `parse()` function takes in a string of valid Javasript text and attempts to generate an Abstract Syntax Tree from its content.
   * If the content is syntactically inaccurate, it throws an error using Siphon's Error handling system.
   */
  static parse = function (input: string, options?: options) {
    return new Ezra().parse(input, options);
  };
}

export default Ezra;
