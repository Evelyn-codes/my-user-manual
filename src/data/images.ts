import type {ResultKey} from './types';
export const images:Record<ResultKey,string> = {
  "A1-B1-C1": "/characters/01.jpeg",
  "A1-B1-C2": "/characters/02 省电.jpeg",
  "A1-B2-C1": "/characters/03.png",
  "A1-B2-C2": "/characters/04.jpeg",
  "A1-B3-C1": "/characters/05.jpeg",
  "A1-B3-C2": "/characters/06.jpeg",
  "A2-B1-C1": "/characters/07.jpeg",
  "A2-B1-C2": "/characters/08.jpeg",
  "A2-B2-C1": "/characters/09.jpeg",
  "A2-B2-C2": "/characters/10.png",
  "A2-B3-C1": "/characters/11.jpeg",
  "A2-B3-C2": "/characters/12.jpeg",
  "A3-B1-C1": "/characters/13.jpeg",
  "A3-B1-C2": "/characters/14.jpeg",
  "A3-B2-C1": "/characters/15.jpeg",
  "A3-B2-C2": "/characters/16.jpeg",
  "A3-B3-C1": "/characters/17.jpeg",
  "A3-B3-C2": "/characters/18.jpeg"
};

export const characterImage=(key:ResultKey)=>`${import.meta.env.BASE_URL}characters/v2/${images[key].split('/').at(-1)!.slice(0,2)}.jpg`;

export const characterThumbnail=(key:ResultKey)=>characterImage(key).replace('.jpg','-thumb.jpg');
