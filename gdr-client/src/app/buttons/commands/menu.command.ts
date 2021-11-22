import { CmdButton } from './../buttons.component';
export abstract class MenuCommand implements CmdButton {
  Click: undefined;
  public abstract Items: CmdButton[];
  constructor(public Name: string, public Icon: string, public Label?: string) {}
}
