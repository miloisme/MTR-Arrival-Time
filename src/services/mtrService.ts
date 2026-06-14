import { MTRScheduleResponse } from '../types';

const BASE_URL = 'https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php';

export async function fetchMTRSchedule(line: string, sta: string): Promise<MTRScheduleResponse> {
  const url = `${BASE_URL}?line=${line}&sta=${sta}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch schedule for ${line}-${sta}`);
  }
  return response.json();
}
