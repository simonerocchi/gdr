export interface Scheda {
  UtenteID: number,
  Scheda: {
    Name: string,
    Archetype: string,
    Drive: string,
    Level: number,
    XP: number,
    Traits: string[],
    MaxGrit: number,
    Grit: number,
    Conditions: string[],
    Equipment: string[]
  }
}
