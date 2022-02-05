import { BehaviorSubject, from, Observable, of, Subject, Subscription } from 'rxjs';
import { LoginService } from './../login/login.service';
import { SignalingService } from './../signaling/signaling.service';
import { Injectable } from '@angular/core';
import {
  IceCandidateContent,
  Messaggio,
  RTCDescrInitContent,
  StatoContent,
  TipoMessaggio,
} from '../model/messaggio.model';
import { Player } from '../model/player.model';

enum cameraMode {
  user = 'user',
  environment = 'environment',
  default = 'default',
}

const RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302'
    },
    {

      urls: 'turn:www.squidsystem.xyz:3478?transport=udp',
      username: 'soun',
      credential: 'asega'
    }
  ],
};

@Injectable({
  providedIn: 'root',
})
export class RTCService {
  private streams: Map<number, MediaStream> = new Map<number, MediaStream>();
  private peerConnections: Map<number, RTCPeerConnection> = new Map<
    number,
    RTCPeerConnection
  >();
  private streamingSubscription: Subscription | undefined;

  private _streamAvailable = new Subject<Player>();
  streamAvailable = (() => this._streamAvailable.asObservable())();

  private _streamUnavailable = new Subject<Player>();
  streamUnavailable = (() => this._streamUnavailable.asObservable())();

  private _streaming = new BehaviorSubject<boolean>(false);
  streaming = (() => this._streaming.asObservable())();

  myStream?: Player;

  availableDevices?: MediaDeviceInfo[];

  private _audioOutput = new BehaviorSubject<MediaDeviceInfo | undefined>(undefined);
  get audioOutput() {
    return this._audioOutput.asObservable();
  }

  ready = new BehaviorSubject<boolean>(false);

  private mediaConstraint?: MediaStreamConstraints = {};

  private _prevVideoDevice?: MediaDeviceInfo;
  private get prevVideoDevice(): MediaDeviceInfo | undefined {
    return (
      this._prevVideoDevice ||
      this.availableDevices?.filter((d) => d.kind == 'videoinput')[0]
    );
  }

  get hidden(): boolean {
    return !!!this.mediaConstraint?.video;
  }

  set hidden(value: boolean) {
    if (!value) {
      this.changeVideoDevice(this.prevVideoDevice);
    } else {
      let video = this.mediaConstraint?.video as MediaTrackConstraints;
      if (video) {
        this._prevVideoDevice = this.availableDevices?.find(
          (d) => d.deviceId == video.deviceId
        );
      }
      this.changeVideoDevice(undefined);
    }
  }

  private _prevAudioDevice?: MediaDeviceInfo;
  private get prevAudioDevice(): MediaDeviceInfo | undefined {
    return (
      this._prevAudioDevice ||
      this.availableDevices?.filter((d) => d.kind == 'audioinput')[0]
    );
  }

  get mute(): boolean {
    return !!!this.mediaConstraint?.audio;
  }

  set mute(value: boolean) {
    if (value) {
      this.changeAudioDevice(this.prevAudioDevice);
    } else {
      let audio = this.mediaConstraint?.audio as MediaTrackConstraints;
      if (audio) {
        this._prevAudioDevice = this.availableDevices?.find(
          (d) => d.deviceId == audio.deviceId
        );
      }
      this.changeAudioDevice(undefined);
    }
  }

  isSharingScreen: boolean = false;

  constructor(
    private signaling: SignalingService,
    private login: LoginService
  ) {
    this.signaling.close.subscribe(() => this.stopStreaming());
    from(navigator.mediaDevices.enumerateDevices()).subscribe(
      (mediaDevices) => {
        this.availableDevices = mediaDevices;
        const video = this.availableDevices.filter(
          (d) => d.kind == 'videoinput'
        )[0];
        const audio = this.availableDevices.filter(
          (d) => d.kind == 'audioinput'
        )[0];
        const output = this.availableDevices.filter(
          (d) => d.kind == 'audiooutput'
        )[0];
        if (video != undefined && audio != undefined) {
          this.mediaConstraint!.video = {
            deviceId: video.deviceId ? { exact: video.deviceId } : undefined,
          };
          this.mediaConstraint!.audio = {
            deviceId: audio.deviceId ? { exact: audio.deviceId } : undefined,
          };
          this._audioOutput.next(output);
          this.ready.next(true);
        }
      }
    );
  }
  startStreaming(mediaDeviceObservable?: Observable<MediaStream>) {
    let id = this.login.currentUser!.ID;
    if(!mediaDeviceObservable) {
      mediaDeviceObservable = from(navigator.mediaDevices.getUserMedia(this.mediaConstraint));
    }
    mediaDeviceObservable.subscribe((stream) => {
      this.myStream = { ID: id, MediaStream: stream };
      if (!this._streaming.value) {
        let sub = new Subscription();
        sub.add(
          this.signaling.access.subscribe((messaggio) => {
            if (messaggio.UtenteID == this.login.currentUser?.ID) {
              return;
            }
            let c = messaggio.Content as StatoContent;
            if (c.Online && c.Streaming) {
              this.call(messaggio.UtenteID!);
            } else {
              this.streamingStopped(messaggio.UtenteID!);
            }
          })
        );
        sub.add(
          this.signaling.message.subscribe((messaggio) => {
            let id = messaggio.UtenteID!;
            if (id == this.login.currentUser?.ID) {
              return;
            }
            switch (messaggio.Tipo) {
              case TipoMessaggio.Offer:
                this.arriveOffer(id, messaggio);
                break;
              case TipoMessaggio.IceCandidate:
                this.arriveCandidate(id, messaggio);
                break;
              case TipoMessaggio.Answer:
                this.arriveAnswer(id, messaggio);
                break;
              default:
                break;
            }
          })
        );
        this.streamingSubscription = sub;
        this.signaling.send(<Messaggio>{
          UtenteID: id,
          Tipo: TipoMessaggio.Stato,
          Content: <StatoContent>{
            Online: true,
            Streaming: true,
          },
        });
      }
      this.peerConnections.forEach((pc) => {
        this.myStream?.MediaStream?.getTracks().forEach(
          (track: MediaStreamTrack) => {
            pc.addTrack(track);
          }
        );
      });
      this._streaming.next(true);
    });
  }

  stopStreaming(): void {
    let id = this.login.currentUser!.ID;
    this.myStream?.MediaStream?.getTracks().forEach((t) => t.stop());
    this.myStream = undefined;
    this.signaling.send(<Messaggio>{
      UtenteID: id,
      Tipo: TipoMessaggio.Stato,
      Content: <StatoContent>{
        Online: true,
        Streaming: false,
      },
    });
    this.peerConnections.forEach((pc, id) => this.streamingStopped(id));
    this.streamingSubscription?.unsubscribe();
    this._streaming.next(false);
  }

  streamingStopped(id: number): void {
    let pc = this.peerConnection(id);
    if (pc) {
      pc.close();
      this.peerConnections.delete(id);
      this.streams.delete(id);
      this._streamUnavailable.next({ ID: id });
    }
  }

  changeAudioDevice(device?: MediaDeviceInfo) {
    if (device) {
      this.mediaConstraint!.audio = {
        deviceId: device.deviceId ? { exact: device.deviceId } : undefined,
      };
    } else {
      this.mediaConstraint!.audio = undefined;
    }
    if (this._streaming.value) {
      this.startStreaming();
    }
  }

  changeVideoDevice(device?: MediaDeviceInfo) {
    if (device) {
      this.mediaConstraint!.video = {
        deviceId: device.deviceId ? { exact: device.deviceId } : undefined,
      };
    } else {
      this.mediaConstraint!.video = undefined;
    }
    if (this._streaming.value) {
      this.startStreaming();
    }
  }

  changeMediaDevice(device: MediaDeviceInfo) {
    if (device.kind == 'videoinput') {
      this.mediaConstraint!.video = {
        deviceId: device.deviceId ? { exact: device.deviceId } : undefined,
      };
    } else if (device.kind == 'audioinput') {
      this.mediaConstraint!.audio = {
        deviceId: device.deviceId ? { exact: device.deviceId } : undefined,
      };
    }
    if (this._streaming.value) {
      this.startStreaming();
    }
  }

  changeAudioOutput(device: MediaDeviceInfo) {
    this._audioOutput.next(device);
  }

  async startSharingScreen() {
    this.hidden = true;
    const mediaDevices = navigator.mediaDevices as any;
    const stream = await mediaDevices.getDisplayMedia();
    this.startStreaming(of(stream));
    this.isSharingScreen = true;
  }

  stopSharingScreen() {
    this.hidden = false;
    this.isSharingScreen = false;
  }

  private createPerrConnection(id: number): RTCPeerConnection {
    let pc = new RTCPeerConnection(RTC_CONFIGURATION);
    this.peerConnections.set(id, pc);
    let stream = new MediaStream();
    this.streams.set(id, stream);
    this._streamAvailable.next({ ID: id, MediaStream: stream });
    pc.ontrack = (event) => this.connectionDidTrackEvent(id, event.track);
    pc.onicecandidate = (event) => this.didDiscoverIceCandidate(event, id);
    pc.onconnectionstatechange = () => this.connectionStateDidChange(id);
    pc.oniceconnectionstatechange = () => this.iceConnectionStateDidChange(id);
    this.myStream?.MediaStream?.getTracks().forEach(
      (track: MediaStreamTrack) => {
        pc.addTrack(track);
      }
    );
    pc.onicecandidateerror = (ev) =>
      console.log('onicecandidateerror', 'error type: ' + ev.type);
    return pc;
  }

  async call(id: number): Promise<void> {
    let pc = this.peerConnection(id);
    try {
      let offer = await pc.createOffer();
      this.signaling.send(<Messaggio>{
        UtenteID: this.login.currentUser!.ID,
        Dest: id,
        Tipo: TipoMessaggio.Offer,
        Content: <RTCDescrInitContent>{
          DescriInit: offer,
        },
      });
      await pc.setLocalDescription(offer);
    } catch (e) {
      console.log(e);
    }
  }

  peerConnection(id: number): RTCPeerConnection {
    let pc = this.peerConnections.get(id);
    if (pc) {
      return pc;
    } else {
      return this.createPerrConnection(id);
    }
  }

  /**
   * aggiunge mediaStreamTrack a un remoteStream ed aggiorna _remoteStreamArray che contiene i mediaStream totali da mostrare
   * @param id id della peerConnection che ha registrato evento ontrack
   * @param track MediaStreamTrack da attaccare al remoteStream legata alla peerConnection con tale id
   */
  connectionDidTrackEvent(id: number, track: MediaStreamTrack): any {
    this.streams.get(id)?.addTrack(track);
  }

  private didDiscoverIceCandidate(
    event: RTCPeerConnectionIceEvent,
    id: number
  ) {
    if (event.candidate) {
      this.signaling.send(<Messaggio>{
        UtenteID: this.login.currentUser?.ID,
        Dest: id,
        Tipo: TipoMessaggio.IceCandidate,
        Content: <IceCandidateContent>{
          IceCandidate: event.candidate,
        },
      });
    }
  }

  private connectionStateDidChange(id: number) {
    this.peerConnections.get(id)?.close;
  }

  private iceConnectionStateDidChange(id: number) {
    console.log(
      'RTC ' + id + ' ' + this.peerConnections.get(id)?.connectionState
    );
  }

  private async arriveOffer(id: number, messaggio: Messaggio): Promise<void> {
    let pc = this.peerConnection(id);
    let offer = (messaggio.Content as RTCDescrInitContent).DescriInit;
    try {
      await pc.setRemoteDescription(offer);
      let answer = await pc.createAnswer();
      this.signaling.send(<Messaggio>{
        UtenteID: this.login.currentUser!.ID,
        Dest: id,
        Tipo: TipoMessaggio.Answer,
        Content: <RTCDescrInitContent>{
          DescriInit: answer,
        },
      });
      pc.setLocalDescription(answer);
    } catch (e) {
      console.log(e);
    }
  }

  private async arriveAnswer(id: number, messaggio: Messaggio): Promise<void> {
    let pc = this.peerConnection(id);
    let answer = (messaggio.Content as RTCDescrInitContent).DescriInit;
    try {
      await pc.setRemoteDescription(answer);
    } catch (e) {
      console.log(e);
    }
  }

  private async arriveCandidate(
    id: number,
    messaggio: Messaggio
  ): Promise<void> {
    let pc = this.peerConnection(id);
    let candidate = (messaggio.Content as IceCandidateContent).IceCandidate;
    try {
      await pc.addIceCandidate(candidate);
    } catch (e) {
      console.log(e);
    }
  }
}
