import { HttpClient } from '@angular/common/http';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormArray,
  AbstractControl,
} from '@angular/forms';
import { Component, Input, OnInit } from '@angular/core';
import { Scheda } from '../model/scheda.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-character',
  templateUrl: './character.component.html',
  styleUrls: ['./character.component.scss'],
})
export class CharacterComponent implements OnInit {
  @Input() characterID?: number;
  characterForm: FormGroup;
  get condizioniArray(): FormArray {
    return this.characterForm.get('Condizioni') as FormArray;
  }
  get equipaggiamentoArray(): FormArray {
    return this.characterForm.get('Equipaggiamento') as FormArray;
  }
  get abilitaArray(): FormArray {
    return this.characterForm.get('Abilita') as FormArray;
  }
  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.characterForm = fb.group({
      Nome: ['', Validators.required],
      Ruolo: ['', Validators.required],
      Specialita: ['', Validators.required],
      Abilita: fb.array([]),
      Destino: [0, Validators.required],
      Portafortuna: ['', Validators.required],
      Condizioni: fb.array([]),
      Equipaggiamento: fb.array([]),
      Denaro: [0, Validators.required]
    });
  }

  ngOnInit(): void {
    this.http
      .get<Scheda | null>(environment.apiurl + '/schede/' + this.characterID)
      .subscribe((scheda) => {
        if (scheda == null) {
          this.http
            .post<Scheda>(environment.apiurl + '/schede', <Scheda>{
              UtenteID: this.characterID,
              Scheda: this.characterForm.value,
            })
            .subscribe(nuova => this.setScheda(nuova));
        } else {
          this.setScheda(scheda);
        }
      });
  }

  setScheda(scheda: Scheda) {
    scheda.Scheda.Abilita.forEach((t) => this.addAbilita());
    scheda.Scheda.Condizioni.forEach((t) => this.addCondizione());
    scheda.Scheda.Equipaggiamento.forEach((t) => this.addEquipaggiamento());
    this.characterForm.patchValue(scheda.Scheda);
  }

  onSubmit(): void {
    let scheda = this.characterForm.value;
    this.http
      .put(environment.apiurl + '/schede/' + this.characterID, <Scheda>{
        UtenteID: this.characterID,
        Scheda: scheda,
      })
      .subscribe();
  }

  createArrayItem(): AbstractControl {
    return this.fb.control('', Validators.required);
  }

  addCondizione(): void {
    this.condizioniArray.push(this.createArrayItem());
  }

  removeCondizione(i: number) {
    this.condizioniArray.removeAt(i);
  }

  addEquipaggiamento(): void {
    this.equipaggiamentoArray.push(this.createArrayItem());
  }

  removeEquipaggiamento(i: number) {
    this.equipaggiamentoArray.removeAt(i);
  }

  addAbilita(): void {
    this.abilitaArray.push(this.fb.group({
      NomeAbilita:  ['', Validators.required],
      Dado:  [0, Validators.required]
    }));
  }

  removeAbilita(i: number) {
    this.abilitaArray.removeAt(i);
  }
}
