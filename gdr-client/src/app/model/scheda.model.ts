export interface Scheda {
  UtenteID: number,
  Scheda: {
    Name: string,
    Archetype: string,
    Drive: string,
    Level: number,
    XP: number,
    Vig: number,
    Dex: number,
    Wil: number,
    Boasts: string[],
    MaxGrit: number,
    Grit: number,
    Conditions: string[],
    Equipment: string[],
    Coins: number,
    Armor: number,
  }
}
