import { LoginService } from './../login/login.service';
import { RTCService } from './../rtc/rtc.service';
import { Component, Input, ViewChild } from '@angular/core';
import { Player } from '../model/player.model';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
})
export class PlayerComponent {
  @Input() player: Player | undefined;
  @ViewChild('videoElement', { static: true }) videoElement: any;
  get video(): HTMLVideoElement {
    return this.videoElement.nativeElement;
  }

  get itsMe(): boolean {
    return this.login.currentUser?.ID == this.player?.ID;
  }

  constructor(private rtc: RTCService, private login: LoginService) {}
}
