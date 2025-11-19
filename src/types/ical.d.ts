declare module "ical" {
  export type ICalEventType = "VEVENT" | string;

  export interface ICalEvent {
    type?: ICalEventType;
    start?: Date | string;
    end?: Date | string;
    summary?: string;
    description?: string;
    [key: string]: unknown;
  }

  export interface ICalData {
    [key: string]: ICalEvent;
  }

  export interface ICalApi {
    parseICS: (source: string) => ICalData;
  }

  const ical: ICalApi;
  export default ical;
}
