/**
 * Zero-eval sandboxed JavaScript subset tokenizer, parser, and interpreter
 * for the ICT Algorithmic Sandbox. Eliminates `new Function` / `eval` so
 * strict CSP (`script-src` without `'unsafe-eval'`) works across all browsers
 * and Web Workers while also guarding against prototype/global escape.
 */

type TokenType =
  | 'num'
  | 'str'
  | 'id'
  | 'kw'
  | 'punc'
  | 'op'
  | 'eof';

interface Token {
  type: TokenType;
  value: string;
}

const KEYWORDS = new Set([
  'function', 'return', 'const', 'let', 'var', 'if', 'else', 'for', 'of', 'in',
  'while', 'do', 'break', 'continue', 'new', 'typeof', 'true', 'false', 'null',
  'undefined', 'throw', 'try', 'catch', 'finally', 'switch', 'case', 'default',
]);

const MULTI_OPS = [
  '>>>=', '===', '!==', '>>>', '<<=', '>>=', '**=', '&&=', '||=', '??=',
  '==', '!=', '<=', '>=', '<<', '>>', '&&', '||', '??', '**', '++', '--',
  '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '=>', '?.', '...',
];

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = source.length;

  while (i < n) {
    const ch = source[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === '/' && source[i + 1] === '/') {
      i += 2;
      while (i < n && source[i] !== '\n') i++;
      continue;
    }
    if (ch === '/' && source[i + 1] === '*') {
      i += 2;
      while (i < n && !(source[i] === '*' && source[i + 1] === '/')) i++;
      i += 2;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      i++;
      let str = '';
      while (i < n && source[i] !== quote) {
        if (source[i] === '\\' && i + 1 < n) {
          const esc = source[i + 1];
          if (esc === 'n') str += '\n';
          else if (esc === 't') str += '\t';
          else if (esc === 'r') str += '\r';
          else str += esc;
          i += 2;
        } else {
          str += source[i];
          i++;
        }
      }
      if (i >= n) throw new Error('Unterminated string literal');
      i++;
      tokens.push({ type: 'str', value: str });
      continue;
    }

    if (/\d/.test(ch) || (ch === '.' && /\d/.test(source[i + 1] || ''))) {
      let start = i;
      if (ch === '0' && (source[i + 1] === 'x' || source[i + 1] === 'X')) {
        i += 2;
        while (i < n && /[0-9a-fA-F]/.test(source[i])) i++;
      } else {
        while (i < n && /[\d.]/.test(source[i])) i++;
        if ((source[i] === 'e' || source[i] === 'E') && /[+\-\d]/.test(source[i + 1] || '')) {
          i++;
          if (source[i] === '+' || source[i] === '-') i++;
          while (i < n && /\d/.test(source[i])) i++;
        }
      }
      tokens.push({ type: 'num', value: source.slice(start, i) });
      continue;
    }

    if (/[A-Za-z_$]/.test(ch)) {
      const start = i;
      while (i < n && /[A-Za-z0-9_$]/.test(source[i])) i++;
      const word = source.slice(start, i);
      tokens.push({ type: KEYWORDS.has(word) ? 'kw' : 'id', value: word });
      continue;
    }

    const matchedMulti = MULTI_OPS.find((op) => source.startsWith(op, i));
    if (matchedMulti) {
      tokens.push({
        type: matchedMulti === '...' ? 'punc' : 'op',
        value: matchedMulti,
      });
      i += matchedMulti.length;
      continue;
    }

    if ('(){}[],;:.?'.includes(ch)) {
      tokens.push({ type: ch === '?' ? 'op' : 'punc', value: ch });
      i++;
      continue;
    }

    if ('+-*/%<>=!&|^~'.includes(ch)) {
      tokens.push({ type: 'op', value: ch });
      i++;
      continue;
    }

    throw new Error(`Unexpected character '${ch}'`);
  }

  tokens.push({ type: 'eof', value: '' });
  return tokens;
}

type Pattern =
  | { kind: 'id'; name: string; defaultExpr?: any }
  | { kind: 'arr'; elements: Array<Pattern | { rest: string } | null> }
  | { kind: 'obj'; props: Array<{ key: string; target: Pattern }> };

type AstNode = { type: string; [key: string]: any };

class Parser {
  private pos = 0;
  constructor(private readonly tokens: Token[]) {}

  private peek(offset = 0): Token {
    return this.tokens[this.pos + offset] || { type: 'eof', value: '' };
  }

  private next(): Token {
    const t = this.peek();
    this.pos++;
    return t;
  }

  private match(val: string, type?: TokenType): boolean {
    const t = this.peek();
    if (t.value === val && (!type || t.type === type)) {
      this.pos++;
      return true;
    }
    return false;
  }

  private expect(val: string, type?: TokenType): Token {
    const t = this.peek();
    if (t.value !== val || (type && t.type !== type)) {
      throw new Error(`Expected '${val}', got '${t.value || 'EOF'}'`);
    }
    this.pos++;
    return t;
  }

  parseProgram(): AstNode {
    const body: AstNode[] = [];
    while (this.peek().type !== 'eof') {
      body.push(this.parseStatement());
    }
    return { type: 'Program', body };
  }

  private parseBlock(): AstNode {
    this.expect('{');
    const body: AstNode[] = [];
    while (this.peek().value !== '}' && this.peek().type !== 'eof') {
      body.push(this.parseStatement());
    }
    this.expect('}');
    return { type: 'Block', body };
  }

  private parsePattern(): Pattern {
    const t = this.peek();
    if (t.value === '[') {
      this.next();
      const elements: Array<Pattern | { rest: string } | null> = [];
      while (this.peek().value !== ']') {
        if (this.peek().value === ',') {
          elements.push(null);
          this.next();
          continue;
        }
        if (this.match('...')) {
          const restId = this.next();
          elements.push({ rest: restId.value });
        } else {
          elements.push(this.parsePattern());
        }
        if (!this.match(',')) break;
      }
      this.expect(']');
      return { kind: 'arr', elements };
    }
    if (t.value === '{') {
      this.next();
      const props: Array<{ key: string; target: Pattern }> = [];
      while (this.peek().value !== '}') {
        const keyTok = this.next();
        if (this.match(':')) {
          props.push({ key: keyTok.value, target: this.parsePattern() });
        } else {
          let def: any;
          if (this.match('=')) def = this.parseExpression();
          props.push({ key: keyTok.value, target: { kind: 'id', name: keyTok.value, defaultExpr: def } });
        }
        if (!this.match(',')) break;
      }
      this.expect('}');
      return { kind: 'obj', props };
    }
    const id = this.next();
    if (id.type !== 'id') throw new Error(`Expected identifier in pattern, got '${id.value}'`);
    let defaultExpr: any;
    if (this.match('=')) defaultExpr = this.parseAssignment();
    return { kind: 'id', name: id.value, defaultExpr };
  }

  private parseVarDecl(consumeSemi = true): AstNode {
    const kind = this.next().value; // const | let | var
    const declarations: Array<{ pattern: Pattern; init: AstNode | null }> = [];
    do {
      const pattern = this.parsePattern();
      const init = this.match('=') ? this.parseAssignment() : null;
      declarations.push({ pattern, init });
    } while (this.match(','));
    if (consumeSemi) this.match(';');
    return { type: 'VarDecl', kind, declarations };
  }

  private parseFunctionDecl(): AstNode {
    this.expect('function', 'kw');
    const name = this.next().value;
    this.expect('(');
    const params: Pattern[] = [];
    while (this.peek().value !== ')') {
      params.push(this.parsePattern());
      if (!this.match(',')) break;
    }
    this.expect(')');
    const body = this.parseBlock();
    return { type: 'FnDecl', name, params, body };
  }

  private parseStatement(): AstNode {
    while (this.match(';')) {
      /* empty */
    }
    const t = this.peek();
    if (t.type === 'eof') return { type: 'Empty' };
    if (t.value === '{') return this.parseBlock();
    if (t.type === 'kw' && t.value === 'function') return this.parseFunctionDecl();
    if (t.type === 'kw' && (t.value === 'const' || t.value === 'let' || t.value === 'var')) {
      return this.parseVarDecl(true);
    }
    if (t.type === 'kw' && t.value === 'return') {
      this.next();
      let argument: AstNode | null = null;
      if (this.peek().value !== ';' && this.peek().value !== '}' && this.peek().type !== 'eof') {
        argument = this.parseExpression();
      }
      this.match(';');
      return { type: 'Return', argument };
    }
    if (t.type === 'kw' && t.value === 'if') {
      this.next();
      this.expect('(');
      const test = this.parseExpression();
      this.expect(')');
      const consequent = this.parseStatement();
      const alternate = this.match('else', 'kw') ? this.parseStatement() : null;
      return { type: 'If', test, consequent, alternate };
    }
    if (t.type === 'kw' && t.value === 'while') {
      this.next();
      this.expect('(');
      const test = this.parseExpression();
      this.expect(')');
      const body = this.parseStatement();
      return { type: 'While', test, body };
    }
    if (t.type === 'kw' && t.value === 'for') {
      this.next();
      this.expect('(');
      // Detect for..of / for..in
      const savePos = this.pos;
      const first = this.peek();
      if (first.type === 'kw' && (first.value === 'const' || first.value === 'let' || first.value === 'var')) {
        const declKind = this.next().value;
        const pat = this.parsePattern();
        if (this.match('of', 'kw')) {
          const right = this.parseExpression();
          this.expect(')');
          const body = this.parseStatement();
          return { type: 'ForOf', kind: declKind, pattern: pat, right, body };
        }
        if (this.match('in', 'kw')) {
          const right = this.parseExpression();
          this.expect(')');
          const body = this.parseStatement();
          return { type: 'ForIn', kind: declKind, pattern: pat, right, body };
        }
        this.pos = savePos;
      }
      let init: AstNode | null = null;
      if (this.peek().value !== ';') {
        if (
          this.peek().type === 'kw' &&
          (this.peek().value === 'const' || this.peek().value === 'let' || this.peek().value === 'var')
        ) {
          init = this.parseVarDecl(false);
        } else {
          init = this.parseExpression();
        }
      }
      this.expect(';');
      const test = this.peek().value !== ';' ? this.parseExpression() : null;
      this.expect(';');
      const update = this.peek().value !== ')' ? this.parseExpression() : null;
      this.expect(')');
      const body = this.parseStatement();
      return { type: 'For', init, test, update, body };
    }
    if (t.type === 'kw' && t.value === 'break') {
      this.next();
      this.match(';');
      return { type: 'Break' };
    }
    if (t.type === 'kw' && t.value === 'continue') {
      this.next();
      this.match(';');
      return { type: 'Continue' };
    }
    if (t.type === 'kw' && t.value === 'throw') {
      this.next();
      const argument = this.parseExpression();
      this.match(';');
      return { type: 'Throw', argument };
    }
    if (t.type === 'kw' && t.value === 'try') {
      this.next();
      const block = this.parseBlock();
      let handler: { param: string | null; body: AstNode } | null = null;
      if (this.match('catch', 'kw')) {
        let param: string | null = null;
        if (this.match('(')) {
          param = this.next().value;
          this.expect(')');
        }
        handler = { param, body: this.parseBlock() };
      }
      const finalizer = this.match('finally', 'kw') ? this.parseBlock() : null;
      return { type: 'Try', block, handler, finalizer };
    }
    const expr = this.parseExpression();
    this.match(';');
    return { type: 'ExprStmt', expr };
  }

  private parseExpression(): AstNode {
    let expr = this.parseAssignment();
    while (this.match(',')) {
      const right = this.parseAssignment();
      expr = { type: 'Seq', left: expr, right };
    }
    return expr;
  }

  private parseArrowIfMatches(): AstNode | null {
    const savePos = this.pos;
    try {
      if (this.peek().type === 'id' && this.peek(1).value === '=>') {
        const name = this.next().value;
        this.next();
        const body = this.peek().value === '{' ? this.parseBlock() : this.parseAssignment();
        return { type: 'ArrowFn', params: [{ kind: 'id', name }], body };
      }
      if (this.peek().value === '(') {
        this.next();
        const params: Pattern[] = [];
        while (this.peek().value !== ')') {
          params.push(this.parsePattern());
          if (!this.match(',')) break;
        }
        if (!this.match(')')) {
          this.pos = savePos;
          return null;
        }
        if (!this.match('=>')) {
          this.pos = savePos;
          return null;
        }
        const body = this.peek().value === '{' ? this.parseBlock() : this.parseAssignment();
        return { type: 'ArrowFn', params, body };
      }
    } catch {
      this.pos = savePos;
      return null;
    }
    this.pos = savePos;
    return null;
  }

  private parseAssignment(): AstNode {
    const arrow = this.parseArrowIfMatches();
    if (arrow) return arrow;

    const left = this.parseTernary();
    const op = this.peek().value;
    if (
      op === '=' || op === '+=' || op === '-=' || op === '*=' || op === '/=' ||
      op === '%=' || op === '&=' || op === '|=' || op === '^=' || op === '<<=' || op === '>>='
    ) {
      this.next();
      const right = this.parseAssignment();
      return { type: 'Assign', op, left, right };
    }
    return left;
  }

  private parseTernary(): AstNode {
    const test = this.parseNullish();
    if (this.match('?')) {
      const consequent = this.parseAssignment();
      this.expect(':');
      const alternate = this.parseAssignment();
      return { type: 'Conditional', test, consequent, alternate };
    }
    return test;
  }

  private parseNullish(): AstNode {
    let left = this.parseOr();
    while (this.match('??')) {
      left = { type: 'Logical', op: '??', left, right: this.parseOr() };
    }
    return left;
  }

  private parseOr(): AstNode {
    let left = this.parseAnd();
    while (this.match('||')) {
      left = { type: 'Logical', op: '||', left, right: this.parseAnd() };
    }
    return left;
  }

  private parseAnd(): AstNode {
    let left = this.parseBitOr();
    while (this.match('&&')) {
      left = { type: 'Logical', op: '&&', left, right: this.parseBitOr() };
    }
    return left;
  }

  private parseBitOr(): AstNode {
    let left = this.parseBitXor();
    while (this.match('|')) {
      left = { type: 'Binary', op: '|', left, right: this.parseBitXor() };
    }
    return left;
  }

  private parseBitXor(): AstNode {
    let left = this.parseBitAnd();
    while (this.match('^')) {
      left = { type: 'Binary', op: '^', left, right: this.parseBitAnd() };
    }
    return left;
  }

  private parseBitAnd(): AstNode {
    let left = this.parseEquality();
    while (this.match('&')) {
      left = { type: 'Binary', op: '&', left, right: this.parseEquality() };
    }
    return left;
  }

  private parseEquality(): AstNode {
    let left = this.parseRelational();
    while (['===', '!==', '==', '!='].includes(this.peek().value)) {
      const op = this.next().value;
      left = { type: 'Binary', op, left, right: this.parseRelational() };
    }
    return left;
  }

  private parseRelational(): AstNode {
    let left = this.parseShift();
    while (['<', '<=', '>', '>='].includes(this.peek().value) || (this.peek().type === 'kw' && this.peek().value === 'in')) {
      const op = this.next().value;
      left = { type: 'Binary', op, left, right: this.parseShift() };
    }
    return left;
  }

  private parseShift(): AstNode {
    let left = this.parseAdditive();
    while (['<<', '>>', '>>>'].includes(this.peek().value)) {
      const op = this.next().value;
      left = { type: 'Binary', op, left, right: this.parseAdditive() };
    }
    return left;
  }

  private parseAdditive(): AstNode {
    let left = this.parseMultiplicative();
    while (this.peek().value === '+' || this.peek().value === '-') {
      const op = this.next().value;
      left = { type: 'Binary', op, left, right: this.parseMultiplicative() };
    }
    return left;
  }

  private parseMultiplicative(): AstNode {
    let left = this.parseExponent();
    while (this.peek().value === '*' || this.peek().value === '/' || this.peek().value === '%') {
      const op = this.next().value;
      left = { type: 'Binary', op, left, right: this.parseExponent() };
    }
    return left;
  }

  private parseExponent(): AstNode {
    const left = this.parseUnary();
    if (this.match('**')) {
      return { type: 'Binary', op: '**', left, right: this.parseExponent() };
    }
    return left;
  }

  private parseUnary(): AstNode {
    const t = this.peek();
    if (
      t.value === '!' || t.value === '+' || t.value === '-' || t.value === '~' ||
      t.value === '++' || t.value === '--' || (t.type === 'kw' && t.value === 'typeof')
    ) {
      this.next();
      return { type: 'Unary', op: t.value, prefix: true, argument: this.parseUnary() };
    }
    return this.parsePostfix();
  }

  private parsePostfix(): AstNode {
    let expr = this.parsePrimaryWithNew();
    while (true) {
      if (this.match('.')) {
        const prop = this.next().value;
        expr = { type: 'Member', object: expr, property: { type: 'Literal', value: prop }, computed: false, optional: false };
      } else if (this.match('?.')) {
        const prop = this.next().value;
        expr = { type: 'Member', object: expr, property: { type: 'Literal', value: prop }, computed: false, optional: true };
      } else if (this.match('[')) {
        const prop = this.parseExpression();
        this.expect(']');
        expr = { type: 'Member', object: expr, property: prop, computed: true, optional: false };
      } else if (this.match('(')) {
        const args: Array<AstNode> = [];
        while (this.peek().value !== ')') {
          if (this.match('...')) {
            args.push({ type: 'Spread', argument: this.parseAssignment() });
          } else {
            args.push(this.parseAssignment());
          }
          if (!this.match(',')) break;
        }
        this.expect(')');
        expr = { type: 'Call', callee: expr, args };
      } else if (this.peek().value === '++' || this.peek().value === '--') {
        const op = this.next().value;
        expr = { type: 'Update', op, prefix: false, argument: expr };
      } else {
        break;
      }
    }
    return expr;
  }

  private parsePrimaryWithNew(): AstNode {
    if (this.match('new', 'kw')) {
      const callee = this.parsePrimary();
      let args: AstNode[] = [];
      if (this.match('(')) {
        while (this.peek().value !== ')') {
          args.push(this.parseAssignment());
          if (!this.match(',')) break;
        }
        this.expect(')');
      }
      return { type: 'New', callee, args };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): AstNode {
    const t = this.peek();
    if (t.type === 'num') {
      this.next();
      return { type: 'Literal', value: Number(t.value) };
    }
    if (t.type === 'str') {
      this.next();
      return { type: 'Literal', value: t.value };
    }
    if (t.type === 'kw') {
      if (t.value === 'true') { this.next(); return { type: 'Literal', value: true }; }
      if (t.value === 'false') { this.next(); return { type: 'Literal', value: false }; }
      if (t.value === 'null') { this.next(); return { type: 'Literal', value: null }; }
      if (t.value === 'undefined') { this.next(); return { type: 'Literal', value: undefined }; }
      if (t.value === 'function') {
        this.next();
        const name = this.peek().type === 'id' ? this.next().value : null;
        this.expect('(');
        const params: Pattern[] = [];
        while (this.peek().value !== ')') {
          params.push(this.parsePattern());
          if (!this.match(',')) break;
        }
        this.expect(')');
        const body = this.parseBlock();
        return { type: 'FnExpr', name, params, body };
      }
    }
    if (t.type === 'id') {
      this.next();
      return { type: 'Identifier', name: t.value };
    }
    if (this.match('(')) {
      const expr = this.parseExpression();
      this.expect(')');
      return expr;
    }
    if (this.match('[')) {
      const elements: AstNode[] = [];
      while (this.peek().value !== ']') {
        if (this.match('...')) {
          elements.push({ type: 'Spread', argument: this.parseAssignment() });
        } else {
          elements.push(this.parseAssignment());
        }
        if (!this.match(',')) break;
      }
      this.expect(']');
      return { type: 'ArrayExpr', elements };
    }
    if (this.match('{')) {
      const properties: Array<{ key: string; value: AstNode; spread?: boolean }> = [];
      while (this.peek().value !== '}') {
        if (this.match('...')) {
          properties.push({ key: '', value: this.parseAssignment(), spread: true });
        } else {
          const keyTok = this.next();
          if (this.match(':')) {
            properties.push({ key: keyTok.value, value: this.parseAssignment() });
          } else {
            properties.push({ key: keyTok.value, value: { type: 'Identifier', name: keyTok.value } });
          }
        }
        if (!this.match(',')) break;
      }
      this.expect('}');
      return { type: 'ObjectExpr', properties };
    }
    throw new Error(`Unexpected token '${t.value}'`);
  }
}

class ReturnSignal {
  constructor(public readonly value: any) {}
}
class BreakSignal {}
class ContinueSignal {}

interface Env {
  vars: Map<string, any>;
  consts: Set<string>;
  parent: Env | null;
}

const BLOCKED_PROPS = new Set(['constructor', '__proto__', 'prototype']);

export interface SafeEvalResult {
  solveFn: (input: any) => any;
}

export function compileSafeSolveFunction(
  userCode: string,
  sandboxConsole: { log: (...args: any[]) => void },
  maxSteps = 500_000
): (input: any) => any {
  const ast = new Parser(tokenize(userCode)).parseProgram();
  let steps = 0;
  const tick = () => {
    if (++steps > maxSteps) {
      throw new Error('Execution aborted: step limit exceeded (possible infinite loop).');
    }
  };

  const globalVars = new Map<string, any>([
    ['Math', Math],
    ['Array', Array],
    ['Object', Object],
    ['Map', Map],
    ['Set', Set],
    ['Number', Number],
    ['String', String],
    ['Boolean', Boolean],
    ['JSON', JSON],
    ['Infinity', Infinity],
    ['NaN', NaN],
    ['undefined', undefined],
    ['parseInt', parseInt],
    ['parseFloat', parseFloat],
    ['isNaN', isNaN],
    ['isFinite', isFinite],
    ['console', sandboxConsole],
  ]);

  const rootEnv: Env = { vars: globalVars, consts: new Set(globalVars.keys()), parent: null };

  const lookup = (env: Env, name: string): any => {
    let cur: Env | null = env;
    while (cur) {
      if (cur.vars.has(name)) return cur.vars.get(name);
      cur = cur.parent;
    }
    throw new ReferenceError(`${name} is not defined`);
  };

  const assignVar = (env: Env, name: string, val: any) => {
    let cur: Env | null = env;
    while (cur) {
      if (cur.vars.has(name)) {
        if (cur.consts.has(name)) throw new TypeError(`Assignment to constant variable '${name}'`);
        cur.vars.set(name, val);
        return val;
      }
      cur = cur.parent;
    }
    rootEnv.vars.set(name, val);
    return val;
  };

  const bindPattern = (env: Env, pat: Pattern, value: any, isConst: boolean) => {
    if (pat.kind === 'id') {
      let finalVal = value;
      if (finalVal === undefined && pat.defaultExpr) {
        finalVal = evalExpr(pat.defaultExpr, env);
      }
      env.vars.set(pat.name, finalVal);
      if (isConst) env.consts.add(pat.name);
      else env.consts.delete(pat.name);
      return;
    }
    if (pat.kind === 'arr') {
      const arr = Array.isArray(value) ? value : Array.from(value || []);
      for (let i = 0; i < pat.elements.length; i++) {
        const el = pat.elements[i];
        if (!el) continue;
        if ('rest' in el) {
          env.vars.set(el.rest, arr.slice(i));
          if (isConst) env.consts.add(el.rest);
        } else {
          bindPattern(env, el, arr[i], isConst);
        }
      }
      return;
    }
    const obj = value || {};
    for (const p of pat.props) {
      bindPattern(env, p.target, obj[p.key], isConst);
    }
  };

  const makeFn = (params: Pattern[], body: AstNode, closure: Env) => {
    return (...args: any[]) => {
      const fnEnv: Env = { vars: new Map(), consts: new Set(), parent: closure };
      // Hoist function declarations inside block if any
      if (body.type === 'Block') {
        for (const s of body.body) {
          if (s.type === 'FnDecl') {
            fnEnv.vars.set(s.name, makeFn(s.params, s.body, fnEnv));
          }
        }
      }
      params.forEach((p, idx) => bindPattern(fnEnv, p, args[idx], false));
      if (body.type !== 'Block') {
        return evalExpr(body, fnEnv);
      }
      const res = execBlock(body.body, fnEnv);
      if (res instanceof ReturnSignal) return res.value;
      return undefined;
    };
  };

  const evalMemberTarget = (node: AstNode, env: Env): { obj: any; key: any } => {
    const obj = evalExpr(node.object, env);
    const key = node.computed ? evalExpr(node.property, env) : node.property.value;
    if (typeof key === 'string' && BLOCKED_PROPS.has(key)) {
      throw new Error(`Access to property '${key}' is blocked in sandbox`);
    }
    return { obj, key };
  };

  const applyOp = (op: string, a: any, b: any): any => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return a / b;
      case '%': return a % b;
      case '**': return a ** b;
      case '<<': return a << b;
      case '>>': return a >> b;
      case '>>>': return a >>> b;
      case '<': return a < b;
      case '<=': return a <= b;
      case '>': return a > b;
      case '>=': return a >= b;
      case '==': return a == b;
      case '!=': return a != b;
      case '===': return a === b;
      case '!==': return a !== b;
      case '&': return a & b;
      case '^': return a ^ b;
      case '|': return a | b;
      case 'in': return a in b;
      default: throw new Error(`Unsupported binary operator ${op}`);
    }
  };

  const evalExpr = (node: AstNode, env: Env): any => {
    tick();
    switch (node.type) {
      case 'Literal': return node.value;
      case 'Identifier': return lookup(env, node.name);
      case 'Seq':
        evalExpr(node.left, env);
        return evalExpr(node.right, env);
      case 'ArrayExpr': {
        const out: any[] = [];
        for (const el of node.elements) {
          if (el.type === 'Spread') out.push(...evalExpr(el.argument, env));
          else out.push(evalExpr(el, env));
        }
        return out;
      }
      case 'ObjectExpr': {
        const obj: Record<string, any> = {};
        for (const p of node.properties) {
          if (p.spread) Object.assign(obj, evalExpr(p.value, env));
          else if (!BLOCKED_PROPS.has(p.key)) obj[p.key] = evalExpr(p.value, env);
        }
        return obj;
      }
      case 'ArrowFn':
      case 'FnExpr':
        return makeFn(node.params, node.body, env);
      case 'Unary': {
        if (node.op === '++' || node.op === '--') {
          const delta = node.op === '++' ? 1 : -1;
          if (node.argument.type === 'Identifier') {
            const next = Number(lookup(env, node.argument.name)) + delta;
            return assignVar(env, node.argument.name, next);
          }
          if (node.argument.type === 'Member') {
            const { obj, key } = evalMemberTarget(node.argument, env);
            obj[key] = Number(obj[key]) + delta;
            return obj[key];
          }
        }
        const v = evalExpr(node.argument, env);
        if (node.op === '!') return !v;
        if (node.op === '+') return +v;
        if (node.op === '-') return -v;
        if (node.op === '~') return ~v;
        if (node.op === 'typeof') return typeof v;
        throw new Error(`Unsupported unary op ${node.op}`);
      }
      case 'Update': {
        const delta = node.op === '++' ? 1 : -1;
        if (node.argument.type === 'Identifier') {
          const prev = Number(lookup(env, node.argument.name));
          assignVar(env, node.argument.name, prev + delta);
          return prev;
        }
        if (node.argument.type === 'Member') {
          const { obj, key } = evalMemberTarget(node.argument, env);
          const prev = Number(obj[key]);
          obj[key] = prev + delta;
          return prev;
        }
        throw new Error('Invalid update target');
      }
      case 'Binary':
        return applyOp(node.op, evalExpr(node.left, env), evalExpr(node.right, env));
      case 'Logical': {
        const l = evalExpr(node.left, env);
        if (node.op === '&&') return l ? evalExpr(node.right, env) : l;
        if (node.op === '||') return l ? l : evalExpr(node.right, env);
        return l ?? evalExpr(node.right, env);
      }
      case 'Conditional':
        return evalExpr(node.test, env) ? evalExpr(node.consequent, env) : evalExpr(node.alternate, env);
      case 'Member': {
        const { obj, key } = evalMemberTarget(node, env);
        if ((obj === null || obj === undefined) && node.optional) return undefined;
        return obj[key];
      }
      case 'Assign': {
        const rhs = evalExpr(node.right, env);
        if (node.left.type === 'Identifier') {
          if (node.op === '=') return assignVar(env, node.left.name, rhs);
          const baseOp = node.op.slice(0, -1);
          const next = applyOp(baseOp, lookup(env, node.left.name), rhs);
          return assignVar(env, node.left.name, next);
        }
        if (node.left.type === 'Member') {
          const { obj, key } = evalMemberTarget(node.left, env);
          if (node.op === '=') {
            obj[key] = rhs;
            return rhs;
          }
          const baseOp = node.op.slice(0, -1);
          obj[key] = applyOp(baseOp, obj[key], rhs);
          return obj[key];
        }
        throw new Error('Invalid assignment target');
      }
      case 'Call': {
        const args: any[] = [];
        for (const a of node.args) {
          if (a.type === 'Spread') args.push(...evalExpr(a.argument, env));
          else args.push(evalExpr(a, env));
        }
        if (node.callee.type === 'Member') {
          const { obj, key } = evalMemberTarget(node.callee, env);
          const fn = obj?.[key];
          if (typeof fn !== 'function') throw new TypeError(`${String(key)} is not a function`);
          return fn.apply(obj, args);
        }
        const fn = evalExpr(node.callee, env);
        if (typeof fn !== 'function') throw new TypeError('Callee is not a function');
        return fn(...args);
      }
      case 'New': {
        const Ctor = evalExpr(node.callee, env);
        const args = node.args.map((a: AstNode) => evalExpr(a, env));
        if (Ctor !== Map && Ctor !== Set && Ctor !== Array && Ctor !== Object) {
          throw new Error('Constructor not allowed in sandbox');
        }
        return new Ctor(...args);
      }
      default:
        throw new Error(`Unsupported expression node: ${node.type}`);
    }
  };

  const execBlock = (stmts: AstNode[], env: Env): any => {
    for (const stmt of stmts) {
      const sig = execStmt(stmt, env);
      if (sig instanceof ReturnSignal || sig instanceof BreakSignal || sig instanceof ContinueSignal) {
        return sig;
      }
    }
    return undefined;
  };

  const execStmt = (node: AstNode, env: Env): any => {
    tick();
    switch (node.type) {
      case 'Empty': return undefined;
      case 'Block': {
        const blockEnv: Env = { vars: new Map(), consts: new Set(), parent: env };
        return execBlock(node.body, blockEnv);
      }
      case 'FnDecl':
        env.vars.set(node.name, makeFn(node.params, node.body, env));
        return undefined;
      case 'VarDecl':
        for (const d of node.declarations) {
          const val = d.init ? evalExpr(d.init, env) : undefined;
          bindPattern(env, d.pattern, val, node.kind === 'const');
        }
        return undefined;
      case 'ExprStmt':
        evalExpr(node.expr, env);
        return undefined;
      case 'Return':
        return new ReturnSignal(node.argument ? evalExpr(node.argument, env) : undefined);
      case 'Break':
        return new BreakSignal();
      case 'Continue':
        return new ContinueSignal();
      case 'Throw':
        throw evalExpr(node.argument, env);
      case 'Try': {
        try {
          const r = execStmt(node.block, env);
          if (r instanceof ReturnSignal || r instanceof BreakSignal || r instanceof ContinueSignal) return r;
        } catch (err) {
          if (node.handler) {
            const catchEnv: Env = { vars: new Map(), consts: new Set(), parent: env };
            if (node.handler.param) catchEnv.vars.set(node.handler.param, err);
            const r = execStmt(node.handler.body, catchEnv);
            if (r instanceof ReturnSignal || r instanceof BreakSignal || r instanceof ContinueSignal) return r;
          } else {
            throw err;
          }
        } finally {
          if (node.finalizer) execStmt(node.finalizer, env);
        }
        return undefined;
      }
      case 'If': {
        const chosen = evalExpr(node.test, env) ? node.consequent : node.alternate;
        if (chosen) return execStmt(chosen, env);
        return undefined;
      }
      case 'While': {
        while (evalExpr(node.test, env)) {
          tick();
          const sig = execStmt(node.body, env);
          if (sig instanceof ReturnSignal) return sig;
          if (sig instanceof BreakSignal) break;
        }
        return undefined;
      }
      case 'For': {
        const loopEnv: Env = { vars: new Map(), consts: new Set(), parent: env };
        if (node.init) {
          if (node.init.type === 'VarDecl') execStmt(node.init, loopEnv);
          else evalExpr(node.init, loopEnv);
        }
        while (!node.test || evalExpr(node.test, loopEnv)) {
          tick();
          const sig = execStmt(node.body, { vars: new Map(), consts: new Set(), parent: loopEnv });
          if (sig instanceof ReturnSignal) return sig;
          if (sig instanceof BreakSignal) break;
          if (node.update) evalExpr(node.update, loopEnv);
        }
        return undefined;
      }
      case 'ForOf': {
        const iterable = evalExpr(node.right, env);
        for (const item of iterable) {
          tick();
          const iterEnv: Env = { vars: new Map(), consts: new Set(), parent: env };
          bindPattern(iterEnv, node.pattern, item, node.kind === 'const');
          const sig = execStmt(node.body, iterEnv);
          if (sig instanceof ReturnSignal) return sig;
          if (sig instanceof BreakSignal) break;
        }
        return undefined;
      }
      case 'ForIn': {
        const target = evalExpr(node.right, env);
        for (const key in target) {
          tick();
          const iterEnv: Env = { vars: new Map(), consts: new Set(), parent: env };
          bindPattern(iterEnv, node.pattern, key, node.kind === 'const');
          const sig = execStmt(node.body, iterEnv);
          if (sig instanceof ReturnSignal) return sig;
          if (sig instanceof BreakSignal) break;
        }
        return undefined;
      }
      default:
        throw new Error(`Unsupported statement node: ${node.type}`);
    }
  };

  for (const s of ast.body) {
    if (s.type === 'FnDecl') {
      rootEnv.vars.set(s.name, makeFn(s.params, s.body, rootEnv));
    }
  }
  for (const s of ast.body) {
    if (s.type !== 'FnDecl') {
      execStmt(s, rootEnv);
    }
  }

  const solveFn = rootEnv.vars.get('solve');
  if (typeof solveFn !== 'function') {
    throw new Error('Define function solve(input)');
  }
  return solveFn;
}
