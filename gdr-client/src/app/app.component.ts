import { RTCService } from './rtc/rtc.service';
import { SignalingService } from './signaling/signaling.service';
import { LoginService } from './login/login.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { CmdButton } from './buttons/buttons.component';
import { MatSidenav } from '@angular/material/sidenav';
import { SubjectCommand } from './buttons/commands/subject.command';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Utente } from './model/utente.model';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

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
    if (value) {
      this.signaling.initSignaling();
      this.rtc.streaming.subscribe((s) => (this.streaming = s));
    } else {
      this.signaling.stopSignaling();
    }
    this.buttons = this.menus?.get('main');
  }
  streaming: boolean = false;
  buttons?: CmdButton[];
  characters: Utente[] = [];
  @ViewChild('rightSidenav') sidevan?: MatSidenav;
  private menus = new Map<string, SubjectCommand[]>();
  constructor(
    private login: LoginService,
    private rtc: RTCService,
    private signaling: SignalingService,
    private http: HttpClient
  ) {}
  ngOnInit(): void {
    this.login.userAccess.asObservable().subscribe((utente) => {
      this.logged = utente != null;
      this.loadCharacters();
    });
    this.menus?.set('main', [
      new SubjectCommand(
        {
          Name: 'streaming-main',
          Icon: 'videocam',
          Label: 'stream on',
        },
        () => {
          if (this.streaming) {
            this.buttons = this.menus?.get('stream');
          } else {
            this.rtc.startStreaming();
          }
        }
      ),
      new SubjectCommand(
        {
          Name: 'sidenav-toggle',
          Icon: 'menu',
          Label: 'sidenav toggle',
        },
        () => this.sidevan?.toggle()
      ),
    ]);
    this.menus?.set('stream', [
      new SubjectCommand(
        {
          Name: 'stream-back',
          Icon: 'close',
          Label: 'back',
        },
        () => {
          this.buttons = this.menus?.get('main');
        }
      ),
      new SubjectCommand(
        {
          Name: 'stream-off',
          Icon: 'videocam_off',
          Label: 'stop streaming',
        },
        () => {
          this.rtc.stopStreaming();
          this.buttons = this.menus?.get('main');
        }
      ),
    ]);
  }

  loadCharacters() {
    const utente = this.login.currentUser;
    if (utente?.IsMaster) {
      this.http
        .get<Utente[]>(environment.apiurl + '/utenti/', {
          params: new HttpParams().set(
            'q',
            'ID.notequalnumber=' + this.login.currentUser!.ID
          ),
        })
        .subscribe((utenti) => {
          this.characters = utenti;
        });
    } else if (utente) {
      this.characters = [utente!];
    }
  }

  setMaster(utente: Utente) {
    utente.IsMaster;
    this.http
      .post<Utente>(environment.apiurl + '/utenti/' + utente.ID, utente)
      .subscribe((u) => {
        this.login.currentUser!.IsMaster = false;
        this.loadCharacters();
      });
  }

  remove(utente: Utente) {
    this.http
      .delete(environment.apiurl + '/utenti/' + utente.ID)
      .subscribe(() => this.loadCharacters());
  }
}
