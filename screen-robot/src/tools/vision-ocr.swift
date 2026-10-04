import Foundation
import Vision
import AppKit

guard CommandLine.arguments.count > 1 else {
  fputs("usage: vision-ocr <image>\n", stderr)
  exit(2)
}
let path = CommandLine.arguments[1]
guard let img = NSImage(contentsOfFile: path),
      let tiff = img.tiffRepresentation,
      let rep = NSBitmapImageRep(data: tiff),
      let cg = rep.cgImage else {
  fputs("failed to load image\n", stderr)
  exit(1)
}
let w = Double(cg.width)
let h = Double(cg.height)
let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.usesLanguageCorrection = false
request.recognitionLanguages = ["en-US", "pt-BR"]
let handler = VNImageRequestHandler(cgImage: cg, options: [:])
try handler.perform([request])
var out: [[String: Any]] = []
for obs in request.results ?? [] {
  guard let cand = obs.topCandidates(1).first else { continue }
  let bb = obs.boundingBox // normalized, origin bottom-left
  let x = bb.origin.x * w
  let yTop = (1.0 - bb.origin.y - bb.size.height) * h
  let ww = bb.size.width * w
  let hh = bb.size.height * h
  out.append([
    "text": cand.string,
    "confidence": cand.confidence,
    "bounds": ["x": Int(x), "y": Int(yTop), "w": max(1, Int(ww)), "h": max(1, Int(hh))]
  ])
}
let data = try JSONSerialization.data(withJSONObject: out, options: [.prettyPrinted, .sortedKeys])
FileHandle.standardOutput.write(data)
print("")
