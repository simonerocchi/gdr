import { Utente } from './utente.model';

export interface RollResult {
  V: number;
  Dices: number[];
  Choices: number[];
  Result: number;
  Critic?: boolean;
}

export interface Messaggio {
  ID?: number,
  Content: {},
  DataOra?: Date,
  UtenteID?: number,
  Utente?: Utente,
  Dest?: number,
  Tipo?: TipoMessaggio
}

export interface StatoContent {
  Online: boolean,
  Streaming: boolean,
  Fake: boolean
}

export interface ChatContent {
  Testo: string
  Dice?: RollResult
}

export interface IceCandidateContent {
  IceCandidate: RTCIceCandidate
}

export interface RTCDescrInitContent {
  DescriInit: RTCSessionDescriptionInit
}

export enum TipoMessaggio {
  Stato = "STATO",
  Chat = "CHAT",
  Offer = "OFFER",
  IceCandidate = "ICE_CANDIDATE",
  Answer = "ANSWER",
  Other = ""
}
