import { Utente } from './../model/utente.model';
import { SignalingService } from './../signaling/signaling.service';
import { Component, OnInit } from '@angular/core';
import { LoginService } from '../login/login.service';
import { Player } from '../model/player.model';
import { RTCService } from '../rtc/rtc.service';

@Component({
  selector: 'app-players',
  templateUrl: './players.component.html',
  styleUrls: ['./players.component.scss'],
})
export class PlayersComponent implements OnInit {
  streamers: Player[] = [];
  private _logged: boolean = false;
  private _ontopId?: number;
  get ontopPlayer(): Player | undefined {
    if (this._ontopId) {
      return this.streamers.find((p) => p.ID == this._ontopId);
    }
    return undefined;
  }
  set ontopPlayer(value: Player | undefined) {
    if (value) {
      this._ontopId = value.ID;
    } else {
      this._ontopId = undefined;
    }
  }

  set logged(value: boolean) {
    this._logged = value;
    if (value) {
      this.rtc.streamAvailable.subscribe((p) => this.streamers.push(p));
      this.rtc.streamUnavailable.subscribe((p) =>
        this.streamers.splice(
          this.streamers.findIndex((pl) => pl.ID == p.ID),
          1
        )
      );
    }
  }
  get logged(): boolean {
    return this._logged;
  }

  get others(): Player[][] {
    const list = this.streamers.filter((p) => p.ID != this._ontopId);
    const colLength: number = 2;
    const rowLength =
      (list.length - (list.length % colLength)) / colLength +
      (list.length % colLength);
    let rows: Player[][] = [];
    for (let r = 0; r < Math.min(colLength, list.length); r++) {
      let row: Player[] = list.slice(r * rowLength, r * rowLength + rowLength);
      rows.push(row);
    }
    return rows;
  }

  get me(): Player | undefined {
    return this.rtc.myStream;
  }

  constructor(private login: LoginService, private rtc: RTCService) {}

  ngOnInit(): void {
    this.login.userAccess
      .asObservable()
      .subscribe((utente) => (this.logged = utente != null));
    // for (let i = 1; i < 5; i++) {
    //   this.streamers.push(<Player>{
    //     ID: -i,
    //     Fake: true,
    //     Utente: <Utente>{
    //       Nome: '' + i,
    //     },
    //   });
    // }
  }
}
