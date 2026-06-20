import AppKit
import Foundation

struct ClipboardTypeRecord: Codable {
    let type: String
    let file: String
}

struct ClipboardItemRecord: Codable {
    let types: [ClipboardTypeRecord]
}

struct ClipboardManifest: Codable {
    let version: Int
    let items: [ClipboardItemRecord]
}

enum BridgeError: Error, CustomStringConvertible {
    case usage
    case noClipboardItems
    case invalidManifest

    var description: String {
        switch self {
        case .usage:
            return "Usage: clipboard-bridge snapshot|restore <directory>"
        case .noClipboardItems:
            return "The clipboard does not contain any archivable items."
        case .invalidManifest:
            return "The clipboard archive manifest is invalid."
        }
    }
}

let fileManager = FileManager.default
let arguments = CommandLine.arguments

guard arguments.count == 3 else {
    fail(BridgeError.usage)
}

let command = arguments[1]
let directory = URL(fileURLWithPath: arguments[2], isDirectory: true)

do {
    switch command {
    case "snapshot":
        try snapshotClipboard(to: directory)
    case "restore":
        try restoreClipboard(from: directory)
    default:
        throw BridgeError.usage
    }
} catch {
    fail(error)
}

func snapshotClipboard(to directory: URL) throws {
    if fileManager.fileExists(atPath: directory.path) {
        try fileManager.removeItem(at: directory)
    }
    try fileManager.createDirectory(at: directory, withIntermediateDirectories: true)

    let pasteboard = NSPasteboard.general
    let sourceItems = pasteboard.pasteboardItems ?? []
    guard !sourceItems.isEmpty else {
        throw BridgeError.noClipboardItems
    }

    var manifestItems: [ClipboardItemRecord] = []
    for (itemIndex, item) in sourceItems.enumerated() {
        var records: [ClipboardTypeRecord] = []
        for (typeIndex, pasteboardType) in item.types.enumerated() {
            guard let data = item.data(forType: pasteboardType) else {
                continue
            }
            let fileName = "item-\(itemIndex)-type-\(typeIndex).bin"
            try data.write(to: directory.appendingPathComponent(fileName), options: .atomic)
            records.append(ClipboardTypeRecord(type: pasteboardType.rawValue, file: fileName))
        }
        if !records.isEmpty {
            manifestItems.append(ClipboardItemRecord(types: records))
        }
    }

    guard !manifestItems.isEmpty else {
        throw BridgeError.noClipboardItems
    }

    let manifest = ClipboardManifest(version: 1, items: manifestItems)
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
    try encoder.encode(manifest).write(
        to: directory.appendingPathComponent("manifest.json"),
        options: .atomic
    )

    var hasPreview = false
    if let image = NSImage(pasteboard: pasteboard),
       let tiff = image.tiffRepresentation,
       let bitmap = NSBitmapImageRep(data: tiff),
       let png = bitmap.representation(using: .png, properties: [:]) {
        try png.write(to: directory.appendingPathComponent("preview.png"), options: .atomic)
        hasPreview = true
    }

    writeJSON([
        "ok": true,
        "itemCount": manifestItems.count,
        "typeCount": manifestItems.reduce(0) { $0 + $1.types.count },
        "hasPreview": hasPreview
    ])
}

func restoreClipboard(from directory: URL) throws {
    let manifestURL = directory.appendingPathComponent("manifest.json")
    let manifestData = try Data(contentsOf: manifestURL)
    let manifest = try JSONDecoder().decode(ClipboardManifest.self, from: manifestData)
    guard manifest.version == 1, !manifest.items.isEmpty else {
        throw BridgeError.invalidManifest
    }

    var outputItems: [NSPasteboardItem] = []
    for itemRecord in manifest.items {
        let item = NSPasteboardItem()
        var restoredTypeCount = 0
        for typeRecord in itemRecord.types {
            let data = try Data(contentsOf: directory.appendingPathComponent(typeRecord.file))
            if item.setData(data, forType: NSPasteboard.PasteboardType(typeRecord.type)) {
                restoredTypeCount += 1
            }
        }
        if restoredTypeCount > 0 {
            outputItems.append(item)
        }
    }

    guard !outputItems.isEmpty else {
        throw BridgeError.invalidManifest
    }

    let pasteboard = NSPasteboard.general
    pasteboard.clearContents()
    guard pasteboard.writeObjects(outputItems) else {
        throw BridgeError.invalidManifest
    }

    writeJSON([
        "ok": true,
        "itemCount": outputItems.count
    ])
}

func writeJSON(_ object: [String: Any]) {
    let data = try! JSONSerialization.data(withJSONObject: object, options: [.sortedKeys])
    FileHandle.standardOutput.write(data)
    FileHandle.standardOutput.write(Data([0x0A]))
}

func fail(_ error: Error) -> Never {
    let message = String(describing: error)
    let data = try! JSONSerialization.data(
        withJSONObject: ["ok": false, "error": message],
        options: [.sortedKeys]
    )
    FileHandle.standardError.write(data)
    FileHandle.standardError.write(Data([0x0A]))
    exit(1)
}
