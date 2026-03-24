export interface MTRLine {
  code: string;
  nameEn: string;
  nameZh: string;
  color: string;
}

export interface MTRStation {
  code: string;
  nameEn: string;
  nameZh: string;
}

export interface TrainArrival {
  seq: string;
  dest: string;
  plat: string;
  time: string;
  ttnt: string;
  valid: string;
}

export interface MTRScheduleResponse {
  status: number;
  message: string;
  curr_time: string;
  sys_time: string;
  data: {
    [key: string]: {
      curr_time: string;
      sys_time: string;
      UP?: TrainArrival[];
      DOWN?: TrainArrival[];
    };
  };
}
