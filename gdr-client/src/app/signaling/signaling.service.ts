import { Messaggio } from './../model/messaggio.model';
import { BehaviorSubject } from 'rxjs';
import { LoginService } from './../login/login.service';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SignalingService {
  private signalingSocket: WebSocket | undefined;
  error: Subject<Event> = new Subject<Event>();
  open: Subject<void> = new Subject<void>();
  close: Subject<void> = new Subject<void>();
  message: Subject<Messaggio> = new Subject<Messaggio>();
  chat: Subject<Messaggio> = new Subject<Messaggio>();
  access: Subject<Messaggio> = new Subject<Messaggio>();
  constructor(private loginService: LoginService) {}
  initSignaling(): void {
    this.signalingSocket = new WebSocket(
      environment.wsurl + '/' + this.loginService.userAccess.value?.JwtToken
    );
    this.signalingSocket.onerror = (event) => this.error.next(event);
    this.signalingSocket.onopen = () => this.open.next();
    this.signalingSocket.onclose = () => this.close.next();
    this.signalingSocket.onmessage = (message) => {
      let m = <Messaggio>JSON.parse(message.data);
      switch (m.Tipo) {
        case 'CHAT':
          this.chat.next(m);
          break;
        case 'STATO':
          this.access.next(m);
          break;
        default:
          this.message.next(m);
          break;
      }
    };
  }
  send(messaggio: Messaggio): void {
    if (this.signalingSocket?.readyState == WebSocket.CLOSED) {
      let s = this.open.subscribe(() => {
        this.send(messaggio);
        s.unsubscribe();
      });
      this.initSignaling();
    } else {
      this.signalingSocket?.send(JSON.stringify(messaggio));
    }
  }
}
