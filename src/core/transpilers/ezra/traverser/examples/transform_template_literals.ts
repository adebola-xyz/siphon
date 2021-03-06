import Ezra from "../..";
import {
  BinaryExpression,
  Literal,
  Program,
  TemplateElement,
  TemplateLiteral,
} from "../../../../../types";
import { TraversalPath } from "../config";
import { newString } from "../helpers/creator";

/**
 * Transforms a template literal e.g.
 * ```js
 * //from
 * `My name is ${name}. How do you do?`;
 * //to an equivalent string expression.
 * "My name is" + name + ". How do you do?";
 * ```
 */
function transform_template_literals(
  node: TemplateLiteral,
  path: TraversalPath
) {
  let bin = new BinaryExpression(node.loc.start),
    transformed = node.quasis.map((q) => {
      let string = new Literal(q.loc.start);
      string.raw = `"${q.value.raw
        .replace(/"/g, '\\"')
        .replace(/[\r]*\n/g, "\\n")}"`;
      return string;
    }),
    ops = node.expressions
      .concat(transformed)
      .sort((a, b) => a.loc.start - b.loc.start);
  bin.operator = "+";
  for (let i = 0; ops[i]; i++) {
    if (bin.left) {
      let left = new BinaryExpression(bin.left?.loc.start);
      left.operator = "+";
      left.left = bin.left;
      left.right = bin.right;
      bin.left = left;
      bin.right = ops[i];
    } else {
      bin.left = ops[i];
      bin.right = ops[++i];
    }
  }
  return bin.right ? bin : bin.left;
}

export default transform_template_literals;
