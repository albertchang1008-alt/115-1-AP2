import Foundation
let root=URL(fileURLWithPath:CommandLine.arguments[1])
let slugs=["kidney-anatomy","nephron-circulation","filtration-clearance","tubular-handling","urine-concentration","urinary-route-micturition","fluid-compartments","water-sodium-regulation","electrolyte-balance","acid-base-homeostasis"]
var strings=[(String,String)](),files=Set<String>()
func collect(_ value:Any,_ path:String){if let s=value as? String {strings.append((path,s))}else if let rows=value as? [Any]{for (i,x) in rows.enumerated(){collect(x,path+"/"+String(i))}}else if let d=value as? [String:Any]{for(k,x)in d where !["sources","figure","id","nodeId","slug","version"].contains(k){collect(x,path+"/"+k)}}}
for slug in slugs {
 let file="materials-src/"+slug+"/content.json",data=try Data(contentsOf:root.appendingPathComponent(file)),c=try JSONSerialization.jsonObject(with:data) as! [String:Any];collect(c,file);let lab=c["lab"] as! [String:Any];files.insert(lab["figure"] as! String);for n in c["nodes"] as! [[String:Any]]{files.insert(n["figure"] as! String)}
}
let pattern=try NSRegularExpression(pattern:"<text\\b[^>]*>(.*?)</text>",options:[.dotMatchesLineSeparators])
for file in files {let text=try String(contentsOf:root.appendingPathComponent("materials-src/figures/"+file),encoding:.utf8);for m in pattern.matches(in:text,range:NSRange(text.startIndex...,in:text)){if let range=Range(m.range(at:1),in:text){strings.append((file,String(text[range])))}}}
var diff=[[String:String]]()
for (file,text) in strings {let protected=text.replacingOccurrences(of:"胜肽",with:"__PEPTIDE__"),converted=protected.applyingTransform(StringTransform("Hans-Hant"),reverse:false)!.replacingOccurrences(of:"__PEPTIDE__",with:"胜肽");if text != converted{diff.append(["path":file,"original":text,"converted":converted])}}
let report:[String:Any] = ["converter":"macOS Foundation Hans-Hant","materials":slugs.count,"figureFiles":files.count,"strings":strings.count,"differences":diff]
print(String(data:try JSONSerialization.data(withJSONObject:report,options:[.prettyPrinted,.sortedKeys]),encoding:.utf8)!)
