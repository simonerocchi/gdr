import { HttpClient } from '@angular/common/http';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormArray,
  AbstractControl,
} from '@angular/forms';
import { Component, Input, OnInit } from '@angular/core';
import { LoginService } from '../login/login.service';
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
  get boastsArray(): FormArray {
    return this.characterForm.get('Boasts') as FormArray;
  }
  get conditionsArray(): FormArray {
    return this.characterForm.get('Conditions') as FormArray;
  }
  get equipmentArray(): FormArray {
    return this.characterForm.get('Equipment') as FormArray;
  }
  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.characterForm = fb.group({
      Name: ['', Validators.required],
      Archetype: ['', Validators.required],
      Drive: ['', Validators.required],
      XP: [0, Validators.required],
      Vig: [0, Validators.required],
      Dex: [0, Validators.required],
      Wil: [0, Validators.required],
      Boasts: fb.array([]),
      MaxGrit: [0, Validators.required],
      Grit: [0, Validators.required],
      Conditions: fb.array([]),
      Equipment: fb.array([]),
      Coins: [0, Validators.required],
      Armor: [0, Validators.required],
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
    scheda.Scheda.Boasts.forEach((t) => this.addBoast());
    scheda.Scheda.Conditions.forEach((t) => this.addCondition());
    scheda.Scheda.Equipment.forEach((t) => this.addEquipment());
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

  addBoast(): void {
    this.boastsArray.push(this.createArrayItem());
  }

  removeBoast(i: number) {
    this.boastsArray.removeAt(i);
  }

  addCondition(): void {
    this.conditionsArray.push(this.createArrayItem());
  }

  removeCondition(i: number) {
    this.conditionsArray.removeAt(i);
  }

  addEquipment(): void {
    this.equipmentArray.push(this.createArrayItem());
  }

  removeEquipment(i: number) {
    this.equipmentArray.removeAt(i);
  }
}
