import { StatoContent } from './messaggio.model';
import { Utente } from "./utente.model";

export interface Player {
  Utente: Utente,
  Stato?: StatoContent
}
