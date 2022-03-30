import fs = require("fs");
import { HTMLDocumentNode } from "../types/html";
import getDOMNodes from "./getDOMNodes";

function createDOMTree(source: fs.PathLike): HTMLDocumentNode[] {
  let nodes = getDOMNodes(source);
  let filledNodes: HTMLDocumentNode[] = [];
  for (let i = 0; nodes[i]; i++) {
    let h = i - 1;
    if (nodes[i].parent) {
      while (nodes[h] && nodes[i].parent !== nodes[h].tagName) h--;
      if (nodes[h]) {
        if (!nodes[h].children) nodes[h].children = [];
        delete nodes[i].parent;
        nodes[h].children?.push(nodes[i]);
      }
    } else filledNodes.push(nodes[i]);
  }
  return filledNodes;
}

export default createDOMTree;
