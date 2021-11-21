import { Subject } from "rxjs";
import { CmdButton } from "../buttons.component";

export class SubjectCommand implements CmdButton {
  Name: string;
  Label?: string;
  Icon: string;
  Click(event: any) {
    this.subject.next();
  }

  private subject = new Subject<void>();

  constructor(conf: {Name:string;Label?:string,Icon:string},subscription: () => void) {
    this.subject.asObservable().subscribe(subscription);
    this.Name = conf.Name;
    this.Label = conf.Label;
    this.Icon = conf.Icon;
  }
}
