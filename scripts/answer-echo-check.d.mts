export interface EchoQuestion {id:string;stem:string;options:string[];answer:number}
export interface EchoInput {scope:string;slug?:string;q:EchoQuestion}
export interface EchoReview {key:string;sha256:string;rules:string[];reason:string}
export const echoSlugs:string[];
export const echoKeywords:string[];
export function normalizeEcho(text:string):string;
export function longestEcho(a:string,b:string):{length:number;text:string};
export function echoFingerprint(q:EchoQuestion):string;
export function scanQuestion(q:EchoQuestion,options?:{keywords?:string[]}):{id:string;sha256:string;stem:string;options:string[];answer:number;matches:Array<{length:number;text:string}>;findings:Array<{rule:string;keywords?:string[]}>};
export function loadEchoQuestions(root?:string):EchoInput[];
export function auditEcho(questions:EchoInput[],reviews?:EchoReview[]):{pass:boolean;questions:number;flagged:number;allowed:number;unresolved:number;rows:Array<{disposition:string}>};
