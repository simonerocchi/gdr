import { StatoContent } from './../model/messaggio.model';
import { LoginService } from './../login/login.service';
import { RTCService } from './../rtc/rtc.service';
import { Component, Input, ViewChild } from '@angular/core';
import { Player } from '../model/player.model';
import { Utente } from '../model/utente.model';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
})
export class PlayerComponent {
  @Input() player: Player | undefined;
  @ViewChild('videoElement') videoElement: any;
  get video(): HTMLVideoElement {
    return this.videoElement.nativeElement;
  }

  get itsMe(): boolean {
    return this.login.currentUser?.ID == this.player?.Utente.ID;
  }

  get utente(): Utente | undefined {
    return this.player?.Utente;
  }

  get stato(): StatoContent | undefined {
    return this.player?.Stato;
  }

  constructor(private rtc: RTCService, private login: LoginService) {
    this.rtc.streamAvailable.subscribe((streamInfo) => {
      if (streamInfo.ID == this.player?.Utente.ID) {
        this.video.srcObject = streamInfo.stream;
        this.video.muted = this.itsMe;
      }
    });
    this.rtc.streamUnavailable.subscribe((id) => {
      if (id == this.player?.Utente.ID) {
        this.video.srcObject = null;
      }
    });
  }

  toggleStreaming(): void {
    if(this.stato?.Streaming) {
      this.rtc.stopStreaming();
    } else {
      this.rtc.startStreaming();
    }
  }
}
