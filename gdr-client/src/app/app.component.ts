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
import { Subject } from 'rxjs';

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
  }
  streaming: boolean = false;
  characters: Utente[] = [];

  availableAudios: MediaDeviceInfo[] = [];

  availableVideos: MediaDeviceInfo[] = [];

  availableOutputs: MediaDeviceInfo[] = [];

  get readyToStream() {
    return this.rtc.ready;
  }

  get isSharingStream() {
    return this.rtc.isSharingScreen;
  }

  get isMaster() {
    return this.login.currentUser?.IsMaster;
  }

  added = new Subject<void>();

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
    this.added.subscribe(() => this.loadCharacters());
    this.rtc.availableDevices.subscribe(devices => {
      this.availableAudios = devices.filter(d =>  d.kind == 'audioinput');
      this.availableVideos = devices.filter(d => d.kind == 'videoinput');
      this.availableOutputs = devices.filter(d => d.kind == 'audiooutput');
    });
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

  toggleStreaming() {
    if(this.streaming) {
      this.rtc.stopStreaming();
    } else {
      this.rtc.startStreaming();
    }
  }

  toggleSharing() {
    if (!this.isSharingStream) {
      this.rtc.startSharingScreen();
    } else {
      this.rtc.stopSharingScreen();
    }
  }

  changeVideoDevice(device: MediaDeviceInfo) {
    this.rtc.changeVideoDevice(device);
  }

  changeAudioDevice(device: MediaDeviceInfo) {
    this.rtc.changeAudioDevice(device);
  }

  changeAudioOutput(device: MediaDeviceInfo) {
    this.rtc.changeAudioOutput(device);
  }

  get mute() {
    return this.rtc.mute;
  }
  set mute(value) {
    this.rtc.mute = value;
  }

  get hidden() {
    return this.rtc.hidden;
  }
  set hidden(value) {
    this.rtc.hidden = value;
  }

}
