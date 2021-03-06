import * as fs from "fs";
import Errors from "../../errors";
import { HTMLDocumentNode } from "../../../types";
import * as Structures from "../../structures";
import getNodeAttributes from "./getNodeAttributes";
import {
  checkForEnd,
  isForeignTag,
  isSpaceCharac,
  isVoid,
  stringMarkers,
} from "../../../utils";
/**
 * Go through an HTML file and return its content as an array of nodes.
 */
function getDOMNodes(source: fs.PathLike): Array<HTMLDocumentNode> {
  let srcText: string = fs.readFileSync(source).toString();
  let tagStack = new Structures.Stack();
  let start = 0;
  let node: HTMLDocumentNode = {
    type: "",
    parent: null,
  };
  let nodes: Array<HTMLDocumentNode> = [];
  let textStore: string = "";
  let textIsCounting = false;

  function handleForeignTags(
    startTag: string,
    textSlice: string,
    i: number,
    attrs?: string,
    k?: number
  ) {
    let j = 1;
    let content: string = "";
    while (textSlice[j]) {
      if (stringMarkers.includes(textSlice[j])) {
        let marker = textSlice[j++];
        content += marker;
        while (textSlice[j] && textSlice[j] !== marker)
          content += textSlice[j++];
        content += textSlice[j++];
      } else if (
        textSlice.slice(j, j + startTag.length + 3) ===
        "</" + startTag + ">"
      ) {
        break;
      } else content += textSlice[j++];
    }
    node = {
      type: "element",
      parent: tagStack.top(),
      attributes: attrs ? getNodeAttributes(attrs) : undefined,
      attributeList: attrs ? attrs : undefined,
      tagName: startTag,
      identifier: k ? ++k : 0,
      start: i,
      stop: j,
      content: content === "" ? undefined : content,
    };
    nodes.push(node);
    return i + j - 1;
  }

  for (let i: number = 0, k = 0; srcText[i]; i++) {
    //   Ignore comments.
    if (srcText.slice(i, i + 4) === "<!--") {
      i += 4;
      while (srcText[i] && srcText.slice(i, i + 3) !== "-->") i++;
      srcText[(i += 3)] ? "" : Errors.enc("COMMENT_UNCLOSED", source, i);
    }
    // Start of tags
    if (srcText[i] == "<") {
      if (textIsCounting) {
        // Push text as text node and clear textStore.
        node = {
          type: "text",
          parent: tagStack.top(),
          identifier: ++k,
          content: textStore.replace(/([\n\r]*)/g, "").replace(/\s[\s]*/g, " "),
        };
        nodes.push(node);
        textStore = "";
      }
      textIsCounting = false;
      // Ignore white spaces
      do i++;
      while (isSpaceCharac(srcText[i]));
      checkForEnd(srcText[i], source);
      //   Start of closing tags.
      if (srcText[i] === "/") {
        // Ignore white spaces.
        do i++;
        while (isSpaceCharac(srcText[i]));
        checkForEnd(srcText[i], source);
        let endofTag: string = "";
        while (srcText[i] && srcText[i] !== " " && srcText[i] !== ">")
          endofTag += srcText[i++];
        if (i > srcText.length) Errors.enc("ABRUPT", source);
        // Ignore white spaces
        while (isSpaceCharac(srcText[i])) i++;
        checkForEnd(srcText[i], source);
        if (endofTag.replace(/\n|\r/g, "") !== tagStack.top()[0])
          Errors.enc("UNEXPECTED_CLOSE", source, i);
        tagStack.pop();
      } else {
        start = i;
        //   Start of opening tags.
        if (srcText[i] === ">") Errors.enc("HTML_FRAGMENT", source, i);
        let startofTag: string = "";
        while (srcText[i] && srcText[i] !== " " && srcText[i] !== ">")
          startofTag += srcText[i++];
        checkForEnd(srcText[i], source);
        startofTag = startofTag.replace(/\n|\r/g, "");
        if (srcText[i] === " ") {
          // Ignore white spaces.
          do i++;
          while (isSpaceCharac(srcText[i]));
          checkForEnd(srcText[i], source);
          //   Get attributes.
          let attributeList = "";
          while (srcText[i] && srcText[i] !== "/" && srcText[i] !== ">") {
            //   Ignore strings.
            if (stringMarkers.includes(srcText[i])) {
              let marker = srcText[i];
              attributeList += srcText[i++];
              while (srcText[i] && srcText[i] !== marker)
                attributeList += srcText[i++];
            }
            // read attributes.
            attributeList += srcText[i++];
          }
          checkForEnd(srcText[i], source);

          if (srcText[i] === ">") {
            /**
             * Foreign tags with attributes.
             */
            if (isForeignTag(startofTag)) {
              i = handleForeignTags(
                startofTag,
                srcText.slice(i),
                i,
                attributeList,
                k
              );
            } else {
              node = {
                type:
                  startofTag.toLowerCase() === "!doctype"
                    ? "definition"
                    : "element",
                parent: tagStack.top(),
                isVoid: isVoid(startofTag) ? true : undefined,
                start,
                stop: i,
                tagName: startofTag,
                identifier: ++k,
                attributes: getNodeAttributes(attributeList),
                attributeList,
              };
              nodes.push(node);
            }
            if (!isVoid(startofTag))
              tagStack.push([startofTag.replace(/\n|\r/g, ""), k]);
          } else if (srcText[i] === "/") {
            // Ignore space characters.
            do i++;
            while (isSpaceCharac(srcText[i]));
            checkForEnd(srcText[i], source);
            node = {
              type: "element",
              tagName: startofTag,
              parent: tagStack.top(),
              identifier: ++k,
              isVoid: isVoid(startofTag) ? true : undefined,
              attributes: getNodeAttributes(attributeList),
              attributeList,
              start,
              stop: i,
            };
            nodes.push(node);

            if (!isVoid(startofTag))
              Errors.enc("INVALID_VOID_TAG", source, i, { name: startofTag });
          }
        } else {
          /**
           * Foreign Tags without Attributes.
           */
          if (isForeignTag(startofTag)) {
            i = handleForeignTags(startofTag, srcText.slice(i), i);
          } else {
            node = {
              type: "element",
              tagName: startofTag,
              identifier: ++k,
              parent: tagStack.top(),
              start,
              stop: i,
            };
            nodes.push(node);
          }

          if (!isVoid(startofTag)) tagStack.push([startofTag, k]);
        }
      }
    } else if (textIsCounting) {
      textStore += srcText[i];
    } else if (!isSpaceCharac(srcText[i])) {
      textStore += srcText[i];
      textIsCounting = true;
    }
  }
  return nodes;
}

export default getDOMNodes;
