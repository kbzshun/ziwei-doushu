/** 套餐与限额（改价格只改这里） */
export interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  days: number | null;
  desc: string;
  highlight?: boolean;
}

export const PLANS: Plan[] = [
  { id: 'month',   name: '包月',  price: 9.9,  period: '30 天',  days: 30,   desc: '先试一个月，随时可停' },
  { id: 'quarter', name: '包季',  price: 19.9, period: '90 天',  days: 90,   desc: '相当于每月 ¥6.6，最划算', highlight: true },
  { id: 'forever', name: '永久',  price: 39.9, period: '一次性', days: null, desc: '一次买断，长期可用' },
];

export const FREE_DAILY_LIMIT = 10;
