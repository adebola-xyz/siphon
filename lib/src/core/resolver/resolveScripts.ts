import { existsSync, PathLike, readFileSync } from "fs";
import Errors from "../../errors";
import tagNameSearch from "../parser/html/tagNameSearch";
import { HTMLDocumentNode } from "../../types";
import relativePath from "../../utils/relativePath";

function resolveScripts(nodes: HTMLDocumentNode[], source: PathLike) {
  let scripts: HTMLDocumentNode[] = tagNameSearch(nodes, "script").filter(
    (node: any) => node.attributes?.src
  );
  scripts.forEach((script) => {
    let reqFile = relativePath(source, script.attributes.src);
    if (!existsSync(reqFile)) Errors.enc("CSS_NON_EXISTENT", reqFile);
    script.type = "element";
    script.tagName = "script";
    delete script.attributes.src;
    script.content = readFileSync(reqFile).toString();
  });
  return nodes;
}

export default resolveScripts;