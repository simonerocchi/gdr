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
  ontopId?: number;

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

  get me(): Player | undefined {
    return this.rtc.myStream;
  }

  constructor(private login: LoginService, private rtc: RTCService) {}

  ngOnInit(): void {
    this.login.userAccess
      .asObservable()
      .subscribe((utente) => (this.logged = utente != null));
  }
}
