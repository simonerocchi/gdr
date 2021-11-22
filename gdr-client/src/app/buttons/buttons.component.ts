import { Component, Input, OnInit } from '@angular/core';
import { RTCService } from '../rtc/rtc.service';

export interface CmdButton {
  Name: string;
  Label?: string;
  Icon: string;
  Click?: (event: any) => void;
}

@Component({
  selector: 'app-buttons',
  templateUrl: './buttons.component.html',
  styleUrls: ['./buttons.component.scss']
})
export class ButtonsComponent implements OnInit {
  @Input() buttons?: CmdButton[];
  constructor(private rtc: RTCService) { }

  ngOnInit(): void {
  }

  execComd(event: any, button: CmdButton) {
    console.log("execCmd",button);
    button.Click!(event);
  }

}
