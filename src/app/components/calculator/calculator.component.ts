import {Component, OnInit} from '@angular/core';
import {ExpressionService} from "../../services/expression/expression.service";

@Component({
  selector: 'calculator',
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.scss']
})
export class CalculatorComponent implements OnInit{
  constructor(private _expression: ExpressionService) {}

  ngOnInit() {
    const operation: string = 'sin(20)+cos(10)';
    const result = this._expression.evaluate(operation);
    this._expression.generateRandNumber().subscribe(console.log);
    console.log(`${operation} =`, result);
  }
}
