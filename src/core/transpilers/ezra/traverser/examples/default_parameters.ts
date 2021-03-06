import {
  AssignmentPattern,
  BinaryExpression,
  ExpressionStatement,
  IfStatement,
} from "../../../../../types";
import {
  assignmentExpression as assign,
  newIdentifier as identifier,
  memberExpression as member,
  numberLiteral as number,
  undefined_,
} from "../helpers/creator";

/**
 * Resolves all default functional parameters. e.g.
 * ```js
 * //from
 * function test(x = 45) {
 * }
 * //to
 * function test(name){
 *    if (x === undefined) x = arguments[0] = 45;
 * }
 * ```
 */
function default_parameters(node: any) {
  if (!(/Function/.test(node.type) && node.params.length)) return;
  for (let i = 0; node.params[i]; i++) {
    let param = node.params[i];
    if (param instanceof AssignmentPattern) {
      let query = new IfStatement(0);
      //   The test (x === undefined)
      let test = new BinaryExpression(0);
      test.operator = "===";
      test.left = param.left;
      test.right = undefined_;
      query.test = test;
      //   The consequent x = arguments[0] = defaultvalue
      //   arguments[0] = defaultvalue
      let argsdot0 = member(identifier("arguments"), number(i), true);
      let cnsqntass1 = assign(argsdot0, "=", param.right);
      let cnsqntass2 = assign(param.left, "=", cnsqntass1);
      let exp = new ExpressionStatement(0);
      exp.expression = cnsqntass2;
      query.consequent = exp;
      query.alternate = null;
      // Change the original pattern to just an identifier
      node.params.splice(i, 1, param.left);
      node.body.body.splice(0, 0, query);
    }
  }
  return node;
}
export default default_parameters;
