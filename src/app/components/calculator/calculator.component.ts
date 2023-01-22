import {Component, OnDestroy, OnInit} from '@angular/core';
import {ExpressionService} from "../../services/expression/expression.service";
import {Subject, Subscription, tap} from "rxjs";
import {FormControl} from "@angular/forms";

interface ICalcButton {
  value: number | string;
  type: 'operator' | 'operand';
  col:string;
  row: string;
  key?: string;
  fn?: Function;
}

@Component({
  selector: 'calculator',
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.scss']
})
export class CalculatorComponent implements OnInit, OnDestroy{

  public buttons: ICalcButton[];
  public mathExpression: FormControl;
  public result$: Subject<string>;
  public loadingRand: boolean;
  public expressionTest: any[];

  private _subscriptions: Subscription[];

  constructor(private _expression: ExpressionService) {
    this.buttons = [
      {
        value: 'C',
        col:'4',
        row: '1',
        type: 'operator',
        fn: () => this._clear()
      },
      {
        value: '+',
        col:'4',
        row: '2',
        type: 'operator',
        key: '+',
        fn: () => this._addOperationFn('+')
      },
      {
        value: '-',
        col:'4',
        row: '3',
        type: 'operator',
        key: '-',
        fn: () => this._addOperationFn('-')
      },
      {
        value: '*',
        col:'4',
        row: '4',
        type: 'operator',
        key: '*',
        fn: () => this._addOperationFn('*')
      },
      {
        value: '/',
        col:'4',
        row: '5',
        type: 'operator',
        key: '/',
        fn: () => this._addOperationFn('/')
      },
      {
        value: 'sin()',
        col:'1',
        row: '1',
        type: 'operator',
        key: 's',
        fn: () => this._addOperationFn('sin(')
      },
      {
        value: 'cos()',
        col:'2',
        row: '1',
        type: 'operator',
        key: 'c',
        fn: () => this._addOperationFn('cos(')
      },
      {
        value: 'tan()',
        col:'3',
        row: '1',
        type: 'operator',
        key: 't',
        fn: () => this._addOperationFn('tan(')
      },
      {
        value: '(',
        col:'1',
        row: '5',
        type: 'operator',
        key: '(',
        fn: () => this._addOperationFn('(')
      },
      {
        value: ')',
        col:'3',
        row: '5',
        type: 'operator',
        key: ')',
        fn: () => this._addOperationFn(')')
      }];
    this.mathExpression = new FormControl('');
    this.result$ = new Subject<string>();
    this.loadingRand = false;
    this.expressionTest = ['sin(sin(30)+cos(20))','sin(30)+cos(20)','sin(30','3++','3+'];
    this._subscriptions = [];
  }

  ngOnInit() {
    this._generateNumbers();
    const sub = this.mathExpression.valueChanges.subscribe((value: string) => {
      this.result$.next('');
      if(value === ''){
        this.result$.next('');
      } else {
        this.result$.next(this.evaluate(value));
      }
    });
    this._subscriptions.push(sub);
  }

  ngOnDestroy() {
    if(this._subscriptions.length > 0){
      this._subscriptions.forEach(subscription => subscription.unsubscribe());
    }
  }
  /*
  * ----------------------------------------------------------
  * Public Methods
  * ----------------------------------------------------------
  * */
  /**
   * @ngdoc function
   * @name evaluate
   *
   * @param {string} expression
   * @description Validate and evaluate expression
   * @return {string} expression result if it is valid else wrong syntax error
   * */
  evaluate(expression: string): string{
    if(!this._expression.isWellFormed(expression)){
      return 'Wrong Syntax';
    }else{
      try{
        return this._expression.evaluate(expression);
      } catch (e) {
        return 'Wrong Syntax';
      }
    }
  }
  /**
   * @ngdoc function
   * @name onKeyPress
   *
   * @param {event} KeyboardEvent
   * @description Handle the keypress event, disable key from [a-z] and some special characters
   * */
  onKeyPress(event: KeyboardEvent){
    const regex = /[^\d()*+-\/]/;
    if(regex.test(event.key)){
      event.preventDefault();
      const button = this.buttons.find(button => button.key ? button.key === event.key : false);
      if(button) button.fn();
    }
  }
  /**
   * @ngdoc function
   * @name addRand
   *
   * @description Load random number from service
   * */
  addRand(): void {
    this.loadingRand = true;
    this.mathExpression.disable();
    this.result$.next('loading number...');
    const sub = this._expression.generateRandNumber()
      .pipe(tap(()=>{
        this.loadingRand = false;
        this.mathExpression.enable();
      })).subscribe(
        (val: number) => {
          this.result$.next('');
          this._updateMathExpression(val.toString());
        }, error => {

          this.result$.next('load failed');
        });
    this._subscriptions.push(sub);
  }
  /*
  * ----------------------------------------------------------
  * Private Methods
  * ----------------------------------------------------------
  * */
  /**
   * @ngdoc function
   * @name _addOperationFn
   *
   * @param {string} operation
   * @description concat operator to the expression
   * */
  private _addOperationFn(operation: string): void {
    this._updateMathExpression(operation);
  }
  /**
   * @ngdoc function
   * @name _clear
   *
   * @description clear expression
   * */
  private _clear(): void {
    this._updateMathExpression('', 'replace');
    this.result$.next('');
  }
  /**
   * @ngdoc function
   * @name _generateNumbers
   *
   * @description generate the buttons for digits
   * */
  private _generateNumbers(): void {
    let row: number = 4;
    let col: number = 1;
    for(let i = 0; i < 10; i++){
      const val = i+1 < 10 ? i+1 : 0
      if(val === 0){
        col = 2;
        row = 5;
      }
      const btn: ICalcButton =  {
        value: val,
        col: col.toString(),
        row: row.toString(),
        type: 'operand',
        fn: () => this._updateMathExpression(val.toString())
      };
      col+=1;
      if(col > 3){
        row-=1;
        col=1;
      }
      this.buttons.push(btn);
    };
  }
  /**
   * @ngdoc function
   * @name _updateMathExpression
   *
   * @param {string} value
   * @param {'add' | 'replace'} action by default add
   * @description update the input (expression) value, if action == add the value is concatenated
   * else the current value is replaced
   * */
  private _updateMathExpression(value: string, action: 'add' | 'replace' = 'add'): void{
    let newValue: string = '';
    if(action === 'add'){
      newValue = this.mathExpression.value+value;
    } else {
      newValue = value
    }
    this.mathExpression.setValue(newValue)
  }
}
