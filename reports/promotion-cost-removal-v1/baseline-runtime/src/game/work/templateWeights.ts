interface Weighted {weight:number;rankWeights?:number[]}
export function getWorkTemplateWeight(t:Weighted & {rank:number},rank:number){return t.rank<=rank?(t.rankWeights===undefined?t.weight:t.rankWeights[rank]??0):0;}
export function getProjectTemplateWeight(t:Weighted & {rankRequirement:number;enabled:boolean},rank:number){return t.enabled&&t.rankRequirement<=rank?(t.rankWeights===undefined?t.weight:t.rankWeights[rank]??0):0;}
export function validRankWeights(t:Weighted,minimumRank:number,rankCount:number){return t.rankWeights===undefined||Array.isArray(t.rankWeights)&&t.rankWeights.length===rankCount&&t.rankWeights.every(w=>Number.isFinite(w)&&w>=0)&&t.rankWeights.some((w,i)=>i>=minimumRank&&w>0);}
