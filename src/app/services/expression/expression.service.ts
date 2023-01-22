import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";

interface INode {
  value: string;
  left: INode | null;
  right: INode | null;
}

@Injectable({
  providedIn: 'root'
})
export class ExpressionService {

  private _operators: any;
  constructor(private _http: HttpClient) {
    this._operators = {
      'sin': true,
      'cos': true,
      'tan': true,
      '(': true,
      ')': true,
      '*': true,
      '+': true,
      '-': true,
      '/': true
    };
  }
  /*
  * ----------------------------------------------------------
  * Public Methods
  * ----------------------------------------------------------
  * */
  /**
   * @ngdoc function
   * @name generateRandNumber
   *
   * @description Get random number from services
   * @return {Observable<number>} Return an observable with the random number
   * */
  public generateRandNumber(): Observable<number>{
    return this._http.get<number>('https://www.random.org/integers/?num=1&min=1&max=100&col=1&base=10&format=plain&rnd=new');
  }
  /**
   * @ngdoc function
   * @name isWellFormed
   *
   * @param {string} expression
   * @description Validate and evaluate expression
   * @return {boolean} true if valid else false
   * */
  public isWellFormed(expression: string): boolean {
    const expressionArray: string[] = this._expressionIntoArray(expression);
    const stack: string[] = [];
    const digitRegex = /\d/;
    const arithOp = /[+\-*\/]/;
    const trigOp = /(sin|cos|tan)/;
    let index = 0;
    let valid: boolean = true;
    while(valid && index < expressionArray.length){
      if(expressionArray[index] === '('){
        if((stack.length > 0 && digitRegex.test(stack.pop())) || expressionArray.length-index-1 === 0){
          valid = false;
        } else {
          stack.push(expressionArray[index]);
        }
      } else if(expressionArray[index] === ')'){
        if(stack.length === 0 && arithOp.test(stack.pop())){
          valid = false;
        } else {
          stack.push(expressionArray[index]);
        }
      } else if(arithOp.test(expressionArray[index])){
        if((stack.length > 0 && arithOp.test(stack.pop())) || expressionArray.length-index-1 === 0){
          valid = false;
        } else {
          stack.push(expressionArray[index]);
        }
      } else if(digitRegex.test(expressionArray[index])){
        if(stack.length > 0 && stack.pop() === ')'){
          valid = false;
        } else {
          stack.push(expressionArray[index]);
        }
      } else if(trigOp.test(expressionArray[index])){
        if(stack.length > 0 && digitRegex.test(stack.pop())){
          valid = false;
        } else {
          stack.push(expressionArray[index]);
        }
      }
      index+=1;
    }

    return valid;
  }
  /**
   * @ngdoc function
   * @name evaluate
   *
   * @param {string} expression mathematic expression
   * @description Process the expression to get the value
   * @return {any} Return the value of the expression
   * */
  public evaluate(expression: string): any {
    const expressionArray = this._expressionIntoArray(expression);
    const postfixArray = this._infixToPostfix(expressionArray);
    const tree = this._constructTree(postfixArray);
    const result = this._parseTree(tree);
    return result;
  }
  /*
  * ----------------------------------------------------------
  * Private Methods
  * ----------------------------------------------------------
  * */
  /**
   * @ngdoc function
   * @name _expressionIntoArray
   *
   * @param {string} expression mathematic expression
   * @description Convert each operator and operand in an element of the array
   * @return {string[]} Return array of string
   * */
  private _expressionIntoArray(expression: string): string[]{
    const result: string[] = [];
    let aux: string = '';
    for(let i = 0; i < expression.length; i++){
      const char = expression[i];
      if(this._isOperator(char)){
        if(aux!=''){
          result.push(aux);
          aux = '';
        }
        result.push(char);
      }else{
        aux+=char;
      }
    };
    if(aux!=''){
      result.push(aux);
    }
    return result;
  }
  /**
   * @ngdoc function
   * @name _precedence
   *
   * @param {string} operator
   * @description Return the precedence of the operator
   * @return {number} Return -1 if the operator is not in consideration
   * */
  private _precedence(operator: string): number{
    if(operator === "sin" || operator === "cos" || operator === 'tan') return 3;
    if(operator === "*" || operator === "/") return 2;
    if(operator === "+" || operator === "-") return 1;
    return -1;
  }
  /**
   * @ngdoc function
   * @name _isOperator
   *
   * @param {string} operator
   * @description Check if the string is an operator in _operators
   * @return {boolean}
   * */
  private _isOperator(operator: string): boolean {
    return this._operators[operator];
  }
  /**
   * @ngdoc function
   * @name _infixToPostfix
   *
   * @param {string[]} expression array of operators and operands
   * @description Convert the infix array to postfix.
   * @return {string[]} array convert to postfix
   * */
  private _infixToPostfix(expression: string[]): string[] {
    let result: any[] = [];
    let stack: any[] = [];
    for (let i = 0; i < expression.length; i++) {
      let c = expression[i];
      if (!isNaN(Number(c))){
        result.push(c);
      }
      else if (c === "("){
        stack.push(c);
      }
      else if (c === ")") {
        while (stack.length > 0 && stack[stack.length - 1] !== "("){
          result.push(stack.pop());
        }
        if (stack.length > 0 && stack[stack.length - 1] !== "(") {
          throw new Error("Invalid Expression");
        }
        else {
          stack.pop();
        }
      } else {
        while (stack.length !== 0 && this._precedence(c) <= this._precedence(stack[stack.length - 1])) {
          result.push(stack.pop());
        }
        stack.push(c);
      }
    }
    while (stack.length > 0){
      result.push(stack.pop());
    }
    return result;
  }
  /**
   * @ngdoc function
   * @name _constructTree
   *
   * @param {string[]} postfix array of operators and operands in postfix.
   * @description Create a binary tree from postfix array.
   * @return {INode} return the root of the tree.
   * */
  private _constructTree(postfix:string[]): INode{
    let st: INode[] = [];
    for (let i = 0; i < postfix.length; i++) {
      if (!this._isOperator(postfix[i])) {
        st.push({value: postfix[i], left: null, right: null});
      } else {
        let t: INode = {value: postfix[i], left: null, right: null};
        if (postfix[i] === "sin" || postfix[i] === "cos" || postfix[i] === "tan") {
          t.right = st.pop();
        } else {
          t.right = st.pop();
          t.left = st.pop();
        }
        st.push(t);
      }
    }
    return st.pop();
  }
  /**
   * @ngdoc function
   * @name _parseTree
   *
   * @param {root} INode root of the tree.
   * @description Traverse the tree evaluation each node.
   * @return {any} return the result of the evaluation
   * */
  private _parseTree(root: INode): any{
    if (root === null) {
      return 0;
    }
    if (root.left === null && root.right === null) {
      return parseFloat(root.value);
    }
    let left = this._parseTree(root.left);
    let right = this._parseTree(root.right);
    if (root.value === "+") {
      return left + right;
    } else if (root.value === "-") {
      return left - right;
    } else if (root.value === "*") {
      return left * right;
    } else if (root.value === "/") {
      return left / right;
    } else if (root.value === "sin") {
      return Math.sin(right);
    } else if (root.value === "cos") {
      return Math.cos(right);
    } else if (root.value === "tan") {
      return Math.tan(right);
    }
  }
}
