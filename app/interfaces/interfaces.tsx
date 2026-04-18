export interface IStation {
  id: string;
  name: string;
  code: string;
}

export interface IDeparture {
  direction: string;
  plannedDateTime: string;
  actualDateTime?: string;
  trainCategory: string;
  plannedTrack?: string;
  actualTrack?: string;
  cancelled: boolean;
}

export interface IDepartures {
  departures: IDeparture[];
}
