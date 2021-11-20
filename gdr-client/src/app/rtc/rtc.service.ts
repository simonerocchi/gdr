import { BehaviorSubject, Subject, Subscription } from 'rxjs';
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

const RTC_CONFIGURATION = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
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
  get mediaConstraint(): any {
    return {
      video: {
        facingMode: this.front ? cameraMode.user : cameraMode.environment,
      },
      audio: true,
    };
  }
  _front: boolean = true; // gestisce la selezione della videocamera frontale o principale

  get front(): boolean {
    return this._front;
  }

  set front(val: boolean) {
    this._front = val;
    this.switchCameras(val ? cameraMode.user : cameraMode.environment);
  }

  constructor(
    private signaling: SignalingService,
    private login: LoginService
  ) {
    this.signaling.close.subscribe(() => this.stopStreaming());
  }
  startStreaming() {
    let id = this.login.currentUser!.ID;
    navigator.mediaDevices.getUserMedia(this.mediaConstraint).then((stream) => {
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
    this.myStream?.MediaStream?.getTracks().forEach(t => t.stop());
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

  /**
   * metodo per cambiare videocamera.   TODO da testare
   * @param camera stringa definita in cameraMode
   */
  private switchCameras(camera: cameraMode) {
    let traks = this.myStream!.MediaStream!.getTracks();
    for (var i = 0; i < traks.length; i++) {
      let track = traks[i];
      let constraints = track.getConstraints();
      if (constraints.facingMode) {
        constraints.facingMode = camera;
      }
      track.applyConstraints(constraints);
    }
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
    this.myStream?.MediaStream?.getTracks().forEach((track: MediaStreamTrack) => {
      pc.addTrack(track);
    });
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
