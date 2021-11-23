import { Messaggio, StatoContent, ChatContent, TipoMessaggio, RollResult } from './../model/messaggio.model';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-messaggio',
  templateUrl: './messaggio-component.component.html',
  styleUrls: ['./messaggio-component.component.scss']
})
export class MessaggioComponentComponent implements OnInit {
  @Input()
  messaggio!: Messaggio;
  tipiMessaggio = TipoMessaggio;
  constructor() { }

  ngOnInit(): void {
  }

  get testo(): string {
    return (this.messaggio.Content as ChatContent).Testo;
  }

  get online(): boolean {
    return (this.messaggio.Content as StatoContent).Online;
  }

  get hasDice(): boolean {
    return (this.messaggio.Content as ChatContent).Dice != undefined;
  }

  get dice(): RollResult | undefined {
    const cc = this.messaggio.Content as ChatContent;
    const d = cc.Dice
    return d;
  }
}
