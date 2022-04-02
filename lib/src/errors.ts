import fs = require("fs");
import path = require("path");
import { isSpaceCharac } from "./core/parser/html/parseUtils";
import { ErrorTypes } from "./types";
function err(message: string, source?: fs.PathLike, charac?: number): void {
  var sourceText: any;
  let i = 1,
    j = 1,
    k = 0;
  if (source && charac) {
    sourceText = fs.readFileSync(source).toString();
    while (i < charac) {
      if (sourceText[i] === "\n") {
        j++;
        k = 0;
      }
      if (!isSpaceCharac(sourceText[i])) k++;
      i++;
    }
  }
  message = `${message} ${
    source
      ? `\n    at ${path.resolve(source.toString())}${
          charac ? `:${j}:${k}` : ""
        }`
      : ""
  }`;
  throw new Error(message);
}

const Errors = {
  enc(type: ErrorTypes, source: fs.PathLike, charac?: number, options?: any) {
    switch (type) {
      case "FILE_NON_EXISTENT":
        err(`Siphon could not find ${source.toString()}.`);
        break;
      case "NO_ROOTDIR":
        err(`The rootDir '${source}' does not exist.`);
        break;
      case "CSS_NON_EXISTENT":
        err(`The stylesheet '${source.toString()}' cannot be found.`);
        break;
      case "CSS_SELF_IMPORT":
        err(
          `recursion_hell: The stylesheet ${source.toString()} has an import to itself.`
        );
        break;
      case "CSS_CIRCULAR_IMPORT":
        err(
          `The stylesheet ${source.toString()} has already been imported into this project.`
        );
        break;
      case "NOT_A_DIRECTORY":
        err(`The path ${source.toString()} does not lead to a directory.`);
        break;
      case "COMMENT_UNCLOSED":
        err(`Siphon encountered an unclosed comment.`, source, charac);
        break;
      case "TAG_UNCLOSED":
        err(`Expected a start tag.`, source, charac);
        break;
      case "HTML_FRAGMENT":
        err(`Siphon does not support HTML fragments.`, source, charac);
        break;
      case "INVALID_TAG":
        err(`Invalid tag Name '${options.name}'`, source, charac);
        break;
      case "INVALID_VOID_TAG":
        err(`'${options.name}' cannot be used as a void tag.`, source, charac);
        break;
      case "ABRUPT":
        err(`Unexpected end of file.`, source);
        break;
      case "CLOSING_TAG_ATTR":
        err(`Attributes are not allowed in the closing tag.`, source, charac);
        break;
      case "UNEXPECTED_CLOSE":
        err(`Encountered unexpected closing tag.`, source, charac);
        break;
      case "OPEN_CURLY_EXPECTED":
        err(`Siphon expected a {`, source, charac);
        break;
    }
  },
};

export default Errors;
