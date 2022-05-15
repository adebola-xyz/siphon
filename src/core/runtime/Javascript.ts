import { PathLike, writeFileSync } from "fs";
import { HTMLDocumentNode, Program, siphonOptions } from "../../types";
import Errors from "../errors";
import { relativePath, fileExists, getFileName } from "../../utils";
import tagNameSearch from "../transpilers/mimo/tagNameSearch";
import Ezra from "../transpilers/ezra";
import { bundler_internals } from "../transpilers/ezra/bundler/base";

/**
 * Perform required transformations on the relationship between Javascript and HTML
 */
class JavascriptResolve {
  resolveJS(
    nodes: HTMLDocumentNode[],
    source: PathLike,
    options: siphonOptions,
    destination: PathLike
  ) {
    this.nodes = nodes;
    this.source = source;
    this.destination = destination;
    this.options = options;
    this.start();
    return nodes;
  }
  start() {
    this.scripts = tagNameSearch(this.nodes, "script").filter(
      (s) => s.attributes?.src?.length
    );
    var body: HTMLDocumentNode = tagNameSearch(this.nodes, "body")[0];
    var script,
      outputAst = new Program(0);
    const bundler = new bundler_internals();
    if (this.scripts.length === 0) return this.nodes;
    for (let i = 0; this.scripts[i]; i++) {
      script = this.scripts[i];
      let pathToFile = relativePath(this.source, script.attributes.src);
      if (script.attributes.type === "module") this.isModule = true;
      else Errors.enc("SOMETHING_WENT_WRONG", pathToFile);
      if (!fileExists(pathToFile)) {
        Errors.enc("MISSING_SCRIPT", this.source, script.start, {
          token: script.attributes.src,
        });
      }
      outputAst.body.push(
        ...bundler.bundle(pathToFile, {
          allowJSX: this.options.allowJSX,
          sourceMaps: false,
        }).body
      );
      // Add imported stylesheets as <link> nodes in the document to be parsed by Palette.
      if (bundler.stylesheets.length) {
        var head: HTMLDocumentNode = tagNameSearch(this.nodes, "head")[0];
        if (head) {
          bundler.stylesheets.forEach((stylesheet) => {
            head.children?.push({
              tagName: "link",
              isVoid: true,
              parent: head,
              childID: head.children.length,
              children: [],
              attributes: { rel: "stylesheet", href: stylesheet },
            });
          });
        }
      }
      delete script.type;
    }
    if (this.options.internalJS || this.options.wickedMode) {
      // INTERNAL SCRIPT
      let script: HTMLDocumentNode = {
        tagName: "script",
        type: "element",
        childID: body.children?.length,
        parent: body,
        attributes: {
          type: "module",
        },
        content:
          Ezra.generate(outputAst, {
            format: this.options.formatFiles && !this.options.wickedMode,
            indent: 3,
          }) + (outputAst.body.length ? "\n" : ""),
      };
      body.children?.push(script);
    } else {
      // External scripts.
      let bundle = getFileName(this.destination) + ".bundle.js";
      let outputFolder = relativePath(this.destination, "./");
      writeFileSync(
        `${outputFolder}/${bundle}`,
        Ezra.generate(outputAst, {
          format: this.options.formatFiles && !this.options.wickedMode,
          indent: 0,
        })
      );
      let script: HTMLDocumentNode = {
        tagName: "script",
        type: "element",
        childID: body.children?.length,
        parent: body,
        attributes: {
          type: "module",
          src: `./${bundle}`,
        },
      };
      body.children?.push(script);
    }
  }
  scripts!: HTMLDocumentNode[];
  source!: PathLike;
  options!: siphonOptions;
  outputText: string = "";
  isModule = false;
  destination!: PathLike;
  nodes!: HTMLDocumentNode[];
  trail: string[] = [];
}
export default JavascriptResolve;