import { RTCService } from './rtc/rtc.service';
import { SignalingService } from './signaling/signaling.service';
import { LoginService } from './login/login.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'Squid System';
  _logged: boolean = false;
  get logged(): boolean {
    return this._logged;
  }
  set logged(value: boolean) {
    this._logged = value;
    if(value) {
      this.signaling.initSignaling();
      this.rtc.streaming.subscribe(s => this.streaming = s);
    } else {
      this.signaling.stopSignaling();
    }
  }
  streaming: boolean = false;
  constructor(private login: LoginService, private rtc: RTCService, private signaling: SignalingService) {
  }
  ngOnInit(): void {
    this.login.userAccess
      .asObservable()
      .subscribe((utente) => (this.logged = utente != null));
  }
  toggleStreaming() {
    if (this.streaming) {
      this.rtc.stopStreaming();
      this.streaming = false;
    } else {
      this.rtc.startStreaming();
    }
  }
}
