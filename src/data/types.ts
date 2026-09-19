export type ResultKey = `A${1|2|3}-B${1|2|3}-C${1|2}`;
export type Scores = readonly [number, number, number];
export interface Question { id:number; title:string; options:readonly {letter:string;text:string;scores:Scores}[] }
export interface ResultCard {key:ResultKey;name:string;code:string;os:string;description:string;tips:readonly string[];footer:string;dimensions:string;selfTips:string}
export interface DemoFixture {answers:readonly number[];scores:Scores;bars:Scores}
