import { Stack } from "../../../structures";
import { ExpressionStatment, JSNode, SequenceExpression } from "../../../types";
import { counterpart } from "../../../utils";
import { ezra } from "./base";

ezra.group = function (context = "expression") {
  let closure = this.belly.top(),
    groupBody: any = [],
    parentOps = this.operators,
    parentBelly = this.belly;
  this.contexts.push(context);
  this.outerspace();
  this.operators = new Stack();
  this.belly = new Stack();
  while (!this.end && this.char !== counterpart[closure]) {
    groupBody.push(this.statement(context));
    this.outerspace();
  }
  if (this.end) this.raise("EXPECTED", counterpart[closure]);
  else this.eat(counterpart[closure]);
  this.operators = parentOps;
  this.belly = parentBelly;
  this.contexts.pop();
  switch (context) {
    case "import":
    case "export":
    case "block":
    case "switch_block":
    case "for_params":
    case "object":
    case "parameters":
    case "array":
    case "class_body":
      return groupBody;
    case "call":
      return groupBody[0];
    case "property":
      if (groupBody.length !== 1) this.raise("JS_COMMA_IN_COMPUTED_PROP");
      if (groupBody[0].type !== "ExpressionStatement") {
        this.raise("EXPRESSION_EXPECTED");
      } else return groupBody[0].expression;
    case "function":
      let args: Array<JSNode | undefined> = [];
      if (groupBody.length > 1) this.raise("EXPRESSION_EXPECTED");
      if (groupBody[0] instanceof ExpressionStatment) {
        var expression = groupBody[0].expression;
        if (expression instanceof SequenceExpression) {
          var expressions = expression.expressions;
          for (let i = 0; expressions[i]; i++) {
            args.push(expressions[i]);
          }
        } else args.push(expression);
      } else if (groupBody[0] !== undefined) this.raise("EXPRESSION_EXPECTED");
      return args;
    case "expression":
      if (groupBody[0] === undefined) {
        var mark = this.j - 2;
        this.outerspace();
        if (this.eat("=>"))
          return this.arrowFunctionExpression(undefined, mark);
      }
    default:
      if (groupBody.length > 1) {
        this.raise("EXPRESSION_EXPECTED");
      } else return groupBody[0];
  }
  return groupBody;
};