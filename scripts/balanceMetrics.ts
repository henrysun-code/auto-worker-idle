export const mean=(xs:number[])=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:0;
export function quantile(xs:number[],p:number){if(!xs.length)return 0;const a=[...xs].sort((a,b)=>a-b),at=(a.length-1)*p,i=Math.floor(at);return a[i]+(a[Math.ceil(at)]-a[i])*(at-i);}
export function slope(xs:number[]){const mx=(xs.length-1)/2,my=mean(xs);let top=0,bottom=0;xs.forEach((y,i)=>{top+=(i-mx)*(y-my);bottom+=(i-mx)**2;});return bottom?top/bottom:0;}
export function stats(xs:number[]){const avg=mean(xs),sd=xs.length>1?Math.sqrt(xs.reduce((n,x)=>n+(x-avg)**2,0)/(xs.length-1)):0,se=sd/Math.sqrt(xs.length||1),t=xs.length>=50?2.01:2.045;return {seedCount:xs.length,mean:avg,median:quantile(xs,.5),p10:quantile(xs,.1),p90:quantile(xs,.9),min:Math.min(...xs),max:Math.max(...xs),standardDeviation:sd,ci95Low:avg-t*se,ci95High:avg+t*se};}
export function longest(xs:boolean[]){let n=0,max=0;for(const x of xs){n=x?n+1:0;max=Math.max(max,n);}return max;}
