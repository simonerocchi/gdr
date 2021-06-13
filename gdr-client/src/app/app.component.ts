import { RTCService } from './rtc/rtc.service';
import { StatoContent } from './model/messaggio.model';
import { Utente } from './model/utente.model';
import { SignalingService } from './signaling/signaling.service';
import { environment } from 'src/environments/environment';
import { LoginService } from './login/login.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'gdr-client';
  private streaming: boolean = false;
  players: Utente[] = [];
  private _logged: boolean = false;
  set logged(value: boolean) {
    this._logged = value;
    if(value) {
      this.signaling.access.subscribe(m => {
        let status = m.Content as StatoContent;
        if(status.Online) {
          this.add(m.Utente!);
        } else {
          this.remove(m.Utente!);
        }
      });
      this.signaling.initSignaling();
    }
  }
  get logged(): boolean {
    return this._logged;
  }
  constructor(private login: LoginService,
    private signaling: SignalingService,
    private rtc: RTCService) {}
  ngOnInit(): void {
    this.login.userAccess.asObservable().subscribe(utente => this.logged = utente != null);
  }
  add(utente: Utente) {
    if(!this.players.some(p => p.ID == utente.ID)) {
      this.players.push(utente);
    }
  }
  remove(utente: Utente) {
    let u = this.players.find(p => p.ID == utente.ID);
    if(u != undefined) {
      let ind = this.players.indexOf(u);
      this.players.splice(ind,1);
    }
  }
  toggleStreaming(): void {
    if(this.streaming) {
      this.rtc.stopStreaming();
    } else {
      this.rtc.startStreaming();
    }
    this.streaming = !this.streaming;
  }
}
