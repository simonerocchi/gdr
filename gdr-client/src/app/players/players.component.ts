import { SignalingService } from './../signaling/signaling.service';
import { Utente } from './../model/utente.model';
import { Component, Input, OnInit } from '@angular/core';
import { LoginService } from '../login/login.service';
import { RTCService } from '../rtc/rtc.service';
import { StatoContent } from '../model/messaggio.model';
import { Player } from '../model/player.model';

@Component({
  selector: 'app-players',
  templateUrl: './players.component.html',
  styleUrls: ['./players.component.scss']
})
export class PlayersComponent implements OnInit {
  players: Player[] = [];
  private streaming: boolean = false;
  private _logged: boolean = false;
  set logged(value: boolean) {
    this._logged = value;
    if(value) {
      this.signaling.access.subscribe(m => {
        let status = m.Content as StatoContent;
        if(status.Online) {
          this.add(<Player> {
            Utente: m.Utente,
            Stato: status
          });
        } else {
          this.remove(m.Utente!.ID);
        }
      });
      this.signaling.initSignaling();
    }
  }
  get logged(): boolean {
    return this._logged;
  }

  constructor(private login: LoginService, private signaling: SignalingService) {
  }

  ngOnInit(): void {
    this.login.userAccess.asObservable().subscribe(utente => this.logged = utente != null);
  }

  add(player: Player) {
    let p = this.players.find(pl => pl.Utente.ID == player.Utente.ID);
    if(!p) {
      this.players.push(player);
    } else {
      p.Stato = player.Stato;
    }
  }
  remove(id: number) {
    let ind = this.players.findIndex(player => player.Utente.ID == id);
    if(ind >= 0) {
      this.players.splice(ind,1);
    }
  }
}
