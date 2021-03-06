import {
  ArrayPattern,
  BlockStatement,
  BreakStatement,
  CatchClause,
  ContinueStatement,
  DoWhileStatement,
  EmptyStatement,
  ExpressionStatement,
  Identifier,
  IfStatement,
  LabeledStatement,
  ObjectPattern,
  ReturnStatement,
  SequenceExpression,
  SwitchCase,
  SwitchStatement,
  ThrowStatement,
  TryStatement,
  VariableDeclaration,
  VariableDeclarator,
  WhileStatement,
} from "../../../../types";
import { isDigit, isValidIdentifierCharacter, trace } from "../../../../utils";
import { ezra } from "./base";
import { keywords } from "./identifiers";

var statementScope: any = {
  block: true,
  global: true,
  case: true,
  labelled: true,
};
ezra.statement = function () {
  this.outerspace();
  let context: any = { [this.contexts.top()]: true };
  switch (true) {
    case context.class_body:
      return this.definition();
    case context.object:
      return this.property();
    case context.parameters:
      return this.parameter();
    case context.array:
      return this.elements();
    case context.import:
      return this.importSpecifier();
    case context.export:
      return this.exportSpecifier();
    case context.expression:
      return this.expression();
    case context.call:
      return this.arguments();
    case context.JSX_attribute:
      return this.jsxAttribute();
    case context.switch_block:
      if (this.text[this.i] === "}") return;
      if (
        !(this.match("case") || this.match("default")) &&
        !(this.text[this.i] === undefined)
      ) {
        this.raise("JS_CASE_EXPECTED");
      } else {
        return this.caseStatement(this.belly.top() === "default");
      }
    default:
      break;
  }
  switch (true) {
    case this.text[this.i] === undefined:
      return;
    case this.eat("/*"):
    case this.eat("//"):
      this.skip();
      break;
    case this.text[this.i] === "(":
      return this.tryExpressionStatement();
    case this.text[this.i] === "{":
      if (statementScope[this.contexts.top()] === undefined) {
        return this.tryExpressionStatement();
      } else {
        this.belly.push(this.text[this.i++]);
        return this.blockStatement();
      }
    case this.match("do"):
      return this.doWhileStatement();
    case this.eat(";"):
      return this.emptyStatement();
    case this.match("if"):
      return this.ifStatement();
    case this.match("for"):
      return this.forStatement();
    case this.match("try"):
      return this.tryStatement();
    case this.match("while"):
      return this.whileStatement();
    case this.match("break"):
      return this.breakStatement();
    case this.match("const"):
    case this.match("var"):
    case this.match("let"):
      return this.variableDeclaration();
    case this.match("async"):
      return this.maybeAsync();
    case this.match("class"):
      return this.classDeclaration();
    case this.match("throw"):
      return this.throwStatement();
    case this.match("switch"):
      return this.switchStatement();
    case this.match("continue"):
      return this.continueStatement();
    case this.match("function"):
      return this.functionDeclaration();
    case this.match("return"):
      return this.returnStatement();
    case this.match("import"):
      var pos = this.i - 6;
      this.outerspace();
      if (this.text[this.i] === "(") {
        this.belly.pop();
        this.i = pos;
        return this.tryExpressionStatement();
      } else return this.importDeclaration();
    case this.match("else"):
      this.raise("JS_ILLEGAL_ELSE");
    case this.match("case"):
      this.raise("JS_ILLEGAL_CASE");
    case this.match("export"):
      return this.exportDeclaration();
    case this.match("default"):
      this.raise("JS_EXPORT_EXPECTED");
    default:
      return this.tryExpressionStatement();
  }
};
ezra.tryExpressionStatement = function () {
  // Try labelled Statements.
  if (
    isValidIdentifierCharacter(this.text[this.i]) &&
    !isDigit(this.text[this.i])
  ) {
    var pos = this.i;
    let label = this.identifier(true);
    this.outerspace();
    if (this.text[this.i] === ":") {
      this.i++;
      return this.labeledStatement(label);
    } else this.i = pos;
  }
  let expstat = new ExpressionStatement(this.i);
  this.operators.push("none");
  expstat.expression = this.expression();
  if (expstat.expression === undefined) return;
  expstat.loc.start = expstat.expression.loc.start;
  expstat.loc.end = expstat.expression.loc.end;
  this.operators.pop();
  if (this.eat(";")) expstat.loc.end = this.i;
  return expstat;
};
ezra.blockStatement = function (eatComma) {
  const blockstat = new BlockStatement(this.i - 1);
  blockstat.body = this.group("block");
  blockstat.loc.end = this.i;
  if (eatComma) {
    this.outerspace();
    this.eat(";");
  }
  return blockstat;
};
ezra.ifStatement = function () {
  this.outerspace();
  if (!this.eat("(")) this.raise("OPEN_BRAC_EXPECTED");
  const ifstat = new IfStatement(this.i - 2);
  ifstat.test = this.group("expression");
  if (ifstat.test === undefined) this.raise("EXPRESSION_EXPECTED");
  this.outerspace();
  ifstat.consequent = this.statement();
  if (ifstat.consequent === undefined) this.raise("EXPRESSION_EXPECTED");
  this.outerspace();
  if (this.match("else")) ifstat.alternate = this.statement();
  else ifstat.alternate = null;
  return ifstat;
};
ezra.emptyStatement = function () {
  const empty = new EmptyStatement(this.i - 1);
  empty.loc.end = this.i;
  return empty;
};
ezra.whileStatement = function () {
  const whilestat = new WhileStatement(this.i - 5);
  this.outerspace();
  if (!this.eat("(")) this.raise("OPEN_BRAC_EXPECTED");
  whilestat.test = this.group("expression");
  this.outerspace();
  whilestat.body = this.statement();
  if (whilestat.body === undefined) this.raise("EXPRESSION_EXPECTED");
  whilestat.loc.end = this.i;
  return whilestat;
};
ezra.doWhileStatement = function () {
  const dwstat = new DoWhileStatement(this.i - 2);
  this.outerspace();
  dwstat.body = this.statement();
  this.outerspace();
  if (!this.eat("while")) this.raise("JS_WHILE_EXPECTED");
  this.outerspace();
  if (!this.eat("(")) this.raise("OPEN_BRAC_EXPECTED");
  dwstat.test = this.group();
  dwstat.loc.end = this.i;
  this.outerspace();
  this.eat(";");
  return dwstat;
};
ezra.switchStatement = function () {
  const switchstat = new SwitchStatement(this.i - 6);
  this.outerspace();
  if (!this.eat("(")) this.raise("OPEN_BRAC_EXPECTED");
  switchstat.discriminant = this.group("expression");
  this.outerspace();
  if (!this.eat("{")) this.raise("OPEN_CURLY_EXPECTED");
  switchstat.cases = this.group("switch_block");
  switchstat.loc.end = this.i;
  return switchstat;
};
ezra.caseStatement = function (isDefault) {
  const switchcase = new SwitchCase(this.i - 4);
  switchcase.test = this.expression("case");
  if (isDefault) switchcase.test = null;
  else if (switchcase.test === undefined) this.raise("EXPRESSION_EXPECTED");
  if (!this.eat(":")) this.raise("COLON_EXPECTED");
  this.outerspace();
  this.contexts.push("case");
  while (
    !(this.text[this.i] === undefined) &&
    this.text[this.i] !== "}" &&
    !this.isNewCaseStatement()
  ) {
    let statement = this.statement();
    switchcase.consequent.push(statement);
    this.outerspace();
  }
  this.contexts.pop();
  switchcase.loc.end =
    switchcase.consequent[switchcase.consequent.length - 1]?.loc.end;
  return switchcase;
};
ezra.breakStatement = function () {
  const breakstat = new BreakStatement(this.i - 5);
  this.outerspace();
  this.eat(";");
  breakstat.loc.end = this.i;
  return breakstat;
};
ezra.continueStatement = function () {
  var pos = this.i;
  const continuestat = new ContinueStatement(this.i - 8);
  this.outerspace();
  if (this.text[this.i] === ";" || /\n/.test(this.text.slice(pos, this.i))) {
    continuestat.label = null;
  } else {
    continuestat.label = this.identifier();
    var { arr }: any = { ...this.contexts };
    if (!arr.find((a: any) => a.label === continuestat.label?.name)) {
      this.raise("JS_ILLEGAL_CONTINUE");
    }
  }
  this.outerspace();
  this.eat(";");
  return continuestat;
};
ezra.throwStatement = function () {
  const throwstat = new ThrowStatement(this.i - 5);
  var pos = this.i;
  this.outerspace();
  if (/\n|;/.test(this.text.slice(pos, this.i)) || this.text[this.i] === "}")
    this.raise("EXPRESSION_EXPECTED");
  else throwstat.argument = this.expression();
  this.eat(";");
  throwstat.loc.end = throwstat.argument?.loc.end;
  return throwstat;
};
ezra.tryStatement = function () {
  const trystat = new TryStatement(this.i - 3);
  this.outerspace();
  if (!this.eat("{")) this.raise("OPEN_CURLY_EXPECTED");
  trystat.block = this.blockStatement();
  this.outerspace();
  if (this.match("catch")) {
    trystat.handler = new CatchClause(this.i - 5);
    this.outerspace();
    if (this.eat("(")) {
      const param = this.group("parameters");
      if (param.length > 1) this.raise("CATCH_NEW_PARAM");
      if (param[0] === undefined) this.raise("IDENTIFIER_EXPECTED");
      if (!(param[0] instanceof Identifier)) {
        this.raise("CATCH_ASSIGN");
      }
      trystat.handler.param = param[0];
    } else trystat.handler.param = null;
    this.outerspace();
    if (!this.eat("{")) this.raise("OPEN_CURLY_EXPECTED");
    trystat.handler.body = this.blockStatement();
    trystat.handler.loc.end = trystat.handler.body.loc.end;
    this.outerspace();
  } else trystat.handler = null;
  if (this.match("finally")) {
    this.outerspace();
    if (!this.eat("{")) this.raise("OPEN_CURLY_EXPECTED");
    trystat.finalizer = this.blockStatement();
  } else trystat.finalizer = null;
  if (trystat.handler === null && trystat.finalizer === null) {
    this.raise("EXPECTED", "catch");
  }
  trystat.loc.end = this.i - 1;
  return trystat;
};
ezra.returnStatement = function () {
  let { arr }: any = { ...this.contexts };
  if (!arr.includes("function")) this.raise("JS_ILLEGAL_RETURN");
  const retstat = new ReturnStatement(this.i - 6);
  var pos = this.i;
  this.outerspace();
  if (
    /;|\}/.test(this.text[this.i]) ||
    /\n/.test(this.text.slice(pos, this.i))
  ) {
    retstat.argument = null;
  } else retstat.argument = this.expression() ?? null;
  // Mark node to prevent it from being generated on a newline.
  if (retstat.argument instanceof SequenceExpression) {
    var exp: any = retstat.argument;
    exp.__isreturn = true;
  }
  this.eat(";");
  retstat.loc.end = this.i;
  return retstat;
};
ezra.labeledStatement = function (label) {
  if (keywords[label.name] === true) this.raise("JS_UNEXPECTED_TOKEN", ":");
  var labelstat = new LabeledStatement(label.loc.start);
  labelstat.label = label;
  this.contexts.push({ label: label.name });
  this.contexts.push("labelled");
  labelstat.body = this.statement();
  this.contexts.pop();
  this.contexts.pop();
  return labelstat;
};
ezra.variableDeclaration = function () {
  const kind = this.belly.pop(),
    vardec = new VariableDeclaration(this.i - kind.length);
  vardec.kind = kind;
  this.outerspace();
  this.contexts.push("declaration");
  do {
    vardec.declarations.push(this.declarator(kind));
  } while (this.text[this.i] === "," ? (this.i++, true) : false);
  this.contexts.pop();
  vardec.loc.end = this.i;
  this.outerspace();
  this.eat(";");
  return vardec;
};
ezra.declarator = function (kind) {
  // Normalize variable declarations.
  let declarator: any = new VariableDeclarator(this.i),
    decExp: any = this.expression();
  if (decExp === undefined) this.raise("VARIABLE_DECLARATION_EXPECTED");
  const forLoopInit = () => {
    let { arr }: any = { ...this.contexts };
    return (
      decExp.type === "BinaryExpression" &&
      (decExp.operator === "of" || decExp.operator === "in") &&
      arr.includes("for_params")
    );
  };
  // Initialized declarators.
  if (decExp.type === "AssignmentExpression" || forLoopInit()) {
    if (decExp.type === "AssignmentExpression" && decExp.operator !== "=") {
      this.raise("JS_UNEXPECTED_TOKEN", decExp.operator, decExp.left?.loc.end);
    }
    // Get declaration IDs, either Object patterns, array patterns or identifiers.
    const type: any = { [decExp.left.type]: true };
    switch (true) {
      case type.Identifier:
        declarator.id = decExp.left;
        break;
      case type.ArrayExpression:
        declarator.id = new ArrayPattern(decExp.left.loc.start);
        declarator.id.elements = decExp.left.elements;
        break;
      case type.ObjectExpression:
        declarator.id = new ObjectPattern(decExp.left.loc.start);
        declarator.id.properties = decExp.left.properties;
        break;
      default:
        this.raise("IDENTIFIER_EXPECTED", undefined, decExp.left.loc.end);
    }
    declarator.id.loc.end = decExp.left.loc.end;
    if (forLoopInit()) {
      declarator[decExp.operator] = true;
      declarator["right_val"] = decExp.right;
      declarator.init = null;
    } else declarator.init = decExp.right;
  }
  // Uninitialized declarators.
  else if (decExp.type === "Identifier") {
    // Block uninitialized const variables.
    if (kind === "const") this.raise("CONST_INIT");
    declarator.id = decExp;
    declarator.init = null;
  } else this.raise("VARIABLE_DECLARATION_EXPECTED");
  declarator.loc.end = decExp.loc.end;
  return declarator;
};
