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
  title = 'Squid System';
  logged: boolean = false;
  constructor(private login: LoginService) {}
  ngOnInit(): void {
    this.login.userAccess.asObservable().subscribe(utente => this.logged = utente != null);
  }
}
