// 唯讀：掃描三份教學內容 JSON 與實際使用 SVG；保留原始 RTF 快照。
import Foundation
let root = URL(fileURLWithPath: CommandLine.arguments[1])
let slugs = ["blood-pressure-regulation", "lymphatic-system", "hemodynamics"]
var files = Set<String>()
for slug in slugs {
    let file = "materials-src/\(slug)/content.json"
    files.insert(file)
    let data = try Data(contentsOf: root.appendingPathComponent(file))
    let content = try JSONSerialization.jsonObject(with: data) as! [String: Any]
    let lab = content["lab"] as! [String: Any]
    files.insert("materials-src/figures/" + (lab["figure"] as! String))
    for node in content["nodes"] as! [[String: Any]] {
        files.insert("materials-src/figures/" + (node["figure"] as! String))
    }
}
var differences = [[String: String]]()
for file in files.sorted() {
    let text = try String(contentsOf: root.appendingPathComponent(file), encoding: .utf8)
    // 「胜肽」是臺灣生化術語，不是勝負的「勝」；ICU逐字轉換會誤判。
    let protected = text.replacingOccurrences(of: "胜肽", with: "__PEPTIDE_TERM__")
    let converted = protected.applyingTransform(StringTransform("Hans-Hant"), reverse: false)!
        .replacingOccurrences(of: "__PEPTIDE_TERM__", with: "胜肽")
    if text != converted {
        let original = text.components(separatedBy: .newlines)
        let traditional = converted.components(separatedBy: .newlines)
        for (index, line) in original.enumerated() {
            if line != traditional[index] {
                differences.append(["file": file, "original": line, "traditional": traditional[index]])
            }
        }
    }
}
let output: [String: Any] = ["filesScanned": files.count, "converter": "macOS Foundation Hans-Hant", "protectedTerminology": ["胜肽"], "differences": differences]
print(String(data: try JSONSerialization.data(withJSONObject: output, options: [.prettyPrinted, .sortedKeys]), encoding: .utf8)!)
