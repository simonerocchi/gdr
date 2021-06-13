import { LoginService } from './../login/login.service';
import { RTCService } from './../rtc/rtc.service';
import { Utente } from './../model/utente.model';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ThisReceiver } from '@angular/compiler';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
})
export class PlayerComponent {
  @Input() player: Utente | undefined;
  @ViewChild('videoElement') videoElement: any;
  get video(): HTMLVideoElement {
    return this.videoElement.nativeElement;
  }

  get itsMe(): boolean {
    return this.login.currentUser?.ID == this.player?.ID;
  }

  constructor(private rtc: RTCService, private login: LoginService) {
    this.rtc.streamAvailable.subscribe((streamInfo) => {
      if (streamInfo.ID == this.player?.ID) {
        this.video.srcObject = streamInfo.stream;
        this.video.muted = this.itsMe;
      }
    });
    this.rtc.streamUnavailable.subscribe((id) => {
      if (id == this.player?.ID) {
        this.video.srcObject = null;
      }
    });
  }
}
