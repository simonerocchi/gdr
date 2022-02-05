import { BehaviorSubject, from, Subject, Subscription } from 'rxjs';
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
import { tap } from 'rxjs/operators';

enum cameraMode {
  user = 'user',
  environment = 'environment',
  default = 'default',
}

const RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
    {
      urls: 'turn:www.squidsystem.xyz:3478?transport=udp',
      username: 'soun',
      credential: 'asega',
    },
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

  availableDevices = new BehaviorSubject<MediaDeviceInfo[]>([]);

  private _audioOutput = new BehaviorSubject<MediaDeviceInfo | undefined>(
    undefined
  );
  get audioOutput() {
    return this._audioOutput.asObservable();
  }

  ready = new BehaviorSubject<boolean>(false);

  private mediaConstraint?: MediaStreamConstraints = {
    audio: true,
    video: true,
  };

  get hidden(): boolean {
    return this.myStream?.MediaStream?.getVideoTracks()[0].enabled || true;
  }

  set hidden(value: boolean) {
    try {
      this.myStream!.MediaStream!.getVideoTracks()[0].enabled = value;
    } finally {
    }
  }

  get mute(): boolean {
    return this.myStream?.MediaStream?.getAudioTracks()[0].enabled || true;
  }

  set mute(value: boolean) {
    try {
      this.myStream!.MediaStream!.getAudioTracks()[0].enabled = value;
    } finally {
    }
  }

  isSharingScreen: boolean = false;
  canShareScreen: boolean = false;
  constructor(
    private signaling: SignalingService,
    private login: LoginService
  ) {
    this.canShareScreen = !!(navigator.mediaDevices as any).getDisplayMedia;
    this.signaling.close.subscribe(() => this.stopStreaming());
    this.ready.next(true);
  }
  inspectDevices() {
    from(navigator.mediaDevices.enumerateDevices()).subscribe(
      (mediaDevices) => {
        this.availableDevices.next(mediaDevices);
        const output = mediaDevices.filter((d) => d.kind == 'audiooutput')[0];
        this._audioOutput.next(output);
      }
    );
  }

  startStreaming() {
    let id = this.login.currentUser!.ID;
    from(navigator.mediaDevices.getUserMedia({ audio: true, video: true }))
      .pipe(tap(() => this.inspectDevices()))
      .subscribe((stream) => {
        this.myStream = { ID: id, MediaStream: stream };
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

  changeDevice(mediaConstraint: MediaStreamConstraints) {
    from(navigator.mediaDevices.getUserMedia(mediaConstraint)).subscribe(
      (stream) => this.changeStream(stream)
    );
  }

  changeStream(stream: MediaStream) {
    stream
      .getTracks()
      .filter((t) =>
        this.myStream?.MediaStream?.getTracks().some((mt) => mt.kind == t.kind)
      )
      .forEach((t) => {
        this.myStream?.MediaStream?.getTracks()
          .filter((mt) => mt.kind == t.kind)
          .forEach((mt) => {
            this.myStream?.MediaStream?.removeTrack(mt);
          });
        this.myStream?.MediaStream?.addTrack(t);
      });
    this.peerConnections.forEach((pc) =>
      pc
        .getSenders()
        .filter((s) => stream.getTracks().some((t) => t.kind == s.track?.kind))
        .forEach((s) =>
          s.replaceTrack(
            stream.getTracks().find((t) => s.track?.kind == t.kind) || null
          )
        )
    );
  }

  changeAudioDevice(device: MediaDeviceInfo) {
    let mc = {
      audio: {
        deviceId: device.deviceId ? { exact: device.deviceId } : undefined,
      },
    };
    this.changeDevice(mc);
  }

  changeVideoDevice(device: MediaDeviceInfo) {
    let mc = {
      video: {
        deviceId: device.deviceId ? { exact: device.deviceId } : undefined,
      },
    };
    this.changeDevice(mc);
  }

  startSharingScreen() {
    const mediaDevices = navigator.mediaDevices as any;
    from(mediaDevices.getDisplayMedia() as Promise<MediaStream>).subscribe(
      (stream) => {
        this.changeStream(stream);
        this.isSharingScreen = true;
      }
    );
  }

  stopSharingScreen() {
    this.changeDevice({ video: true });
    this.isSharingScreen = false;
  }

  private createPerrConnection(id: number): RTCPeerConnection {
    let pc = new RTCPeerConnection(RTC_CONFIGURATION);
    this.peerConnections.set(id, pc);
    let stream = new MediaStream();
    this.streams.set(id, stream);
    this._streamAvailable.next({ ID: id, MediaStream: stream });
    pc.ontrack = (event) => this.connectionDidTrackEvent(id, event);
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
  connectionDidTrackEvent(id: number, event: RTCTrackEvent): any {
    let track = event.track;
    let stream = this.streams.get(id);
    track.onended = function (e) {
      stream?.removeTrack(this);
    };
    console.log('RTC: track event type: ' + event.type);
    stream?.addTrack(track);
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
    console.log(
      'RTC ' + id + ' ' + this.peerConnections.get(id)?.connectionState
    );
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
