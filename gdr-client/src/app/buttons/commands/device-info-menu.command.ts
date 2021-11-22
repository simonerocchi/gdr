import { CmdButton } from './../buttons.component';
import { RTCService } from 'src/app/rtc/rtc.service';
import { MenuCommand } from './menu.command';

export class DeviceInfoMenuCommand extends MenuCommand {
  public Items: CmdButton[] = [];
  constructor(
    private rtc: RTCService,
    name: string,
    icon: string,
    label?: string,
    private deviceKind?: string
  ) {
    super(name, icon, label);
    const that = this;
    this.rtc.availableDevices.subscribe(
      (devices) =>
        (this.Items = devices
          .filter((d) => d.kind == (this.deviceKind || d.kind))
          .map(
            (d) =>
              <CmdButton>{
                Name: d.label,
                Icon: '',
                Label: d.label,
                Click() {
                  that.rtc.changeDevice(d);
                },
              }
          ))
    );
  }
}
