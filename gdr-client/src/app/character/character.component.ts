import { HttpClient } from '@angular/common/http';
import { FormGroup, FormBuilder, Validators, FormArray, AbstractControl } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { LoginService } from '../login/login.service';
import { Scheda } from '../model/scheda.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-character',
  templateUrl: './character.component.html',
  styleUrls: ['./character.component.scss']
})
export class CharacterComponent implements OnInit {
  characterForm: FormGroup;
  get traitsArray(): FormArray {
    return this.characterForm.get('Traits') as FormArray;
  }
  get conditionsArray(): FormArray {
    return this.characterForm.get('Conditions') as FormArray;
  }
  get equipmentArray(): FormArray {
    return this.characterForm.get('Equipment') as FormArray;
  }
  constructor(private fb: FormBuilder, private http: HttpClient, private login: LoginService) {
    this.characterForm = fb.group({
      Name: ['',Validators.required],
      Archetype: ['',Validators.required],
      Drive: ['',Validators.required],
      Level: [0,Validators.required],
      XP: [0,Validators.required],
      Traits: fb.array([]),
      MaxGrit: [0,Validators.required],
      Grit: [0,Validators.required],
      Conditions: fb.array([]),
      Equipment: fb.array([])
    });
   }

  ngOnInit(): void {
    let utente = this.login.currentUser;
    this.http.get<Scheda | null>(environment.apiurl + '/schede/' + utente!.ID).subscribe(scheda => {
      if(scheda == null) {
        this.http.post(environment.apiurl + '/schede',<Scheda> {
          UtenteID: utente!.ID,
          Scheda: this.characterForm.value
        }).subscribe();
      } else {
        scheda.Scheda.Traits.forEach(t => this.addTrait());
        scheda.Scheda.Conditions.forEach(t => this.addCondition());
        scheda.Scheda.Equipment.forEach(t => this.addEquipment());
        this.characterForm.setValue(scheda.Scheda);
      }
    });
  }

  onSubmit(): void {
    let scheda = this.characterForm.value;
    let utente = this.login.currentUser;
    this.http.put(environment.apiurl + '/schede/' + utente!.ID,<Scheda> {
      UtenteID: utente!.ID,
      Scheda: scheda
    }).subscribe();
  }

  createArrayItem(): AbstractControl {
    return this.fb.control('',Validators.required);
  }

  addTrait(): void {
    this.traitsArray.push(this.createArrayItem());
  }

  removeTrait(i: number) {
    this.traitsArray.removeAt(i);
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
