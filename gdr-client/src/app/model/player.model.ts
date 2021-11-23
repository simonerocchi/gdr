import { StatoContent } from './messaggio.model';
import { Utente } from "./utente.model";

export interface Player {
  ID: number,
  MediaStream?: MediaStream,
  Fake?: boolean,
}
