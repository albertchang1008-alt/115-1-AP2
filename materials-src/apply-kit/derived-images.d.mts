export interface Derivative {source:string;sourceSha256:string;sourceSize:[number,number];path:string;sha256:string;size:[number,number];bytes:number}
export interface DerivativeManifest {recipe:{maxLongEdge:number;format:string;quality:number;method:number;lossless:boolean;exact:boolean;resample:string;upscale:boolean};encoder:{pillow:string;libwebp:string};images:Derivative[]}
export function verifyDerivedImages(root?:string):DerivativeManifest;
export function derivedImage(entry:{sha256:string},root?:string):string;
