// Absolute tolerance only at documented semantic breakpoints, never a per-tick round.
export const SEMANTIC_BOUNDARY_EPSILON = 1e-12;
export function canonicalizeBreakpoint(value:number,points:readonly number[]) {
 if(!Number.isFinite(value))return value;
 return points.find(point=>Number.isFinite(point)&&Math.abs(value-point)<=SEMANTIC_BOUNDARY_EPSILON)??value;
}
export function semanticGte(value:number,threshold:number) {
 return value>=threshold||(Number.isFinite(value)&&Number.isFinite(threshold)&&Math.abs(value-threshold)<=SEMANTIC_BOUNDARY_EPSILON);
}
