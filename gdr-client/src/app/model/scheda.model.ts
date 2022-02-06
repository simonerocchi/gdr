export interface Scheda {
  UtenteID: number,
  Scheda: {
    Nome: string,
    Ruolo: string,
    Specialita: string,
    Abilita: {
      NomeAbilita: string,
      Dado: number
    }[],
    Destino: number,
    Portafortuna: string,
    Condizioni: string[],
    Equipaggiamento: string[],
    Denaro: number
  }
}
