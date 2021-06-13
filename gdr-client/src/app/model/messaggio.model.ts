import { Utente } from './utente.model';

export interface Messaggio {
  ID?: number,
  Content: {},
  DataOra?: Date,
  UtenteID?: number,
  Utente?: Utente,
  Dest?: number,
  Tipo?: string
}

export interface StatoContent {
  Online: boolean,
  Streaming: boolean
}

export interface ChatContent {
  Testo: string
  Dice?: number[]
}

export interface IceCandidateContent {
  IceCandidate: RTCIceCandidate
}

export interface RTCDescrInitContent {
  DescriInit: RTCSessionDescriptionInit
}
