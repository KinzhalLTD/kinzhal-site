import Foundation
import UniformTypeIdentifiers
import WebKit

/// Serves the bundled game from `aeloria://localhost/…`, so fetch(), ES modules, local storage and
/// streamed <audio> (HTTP range requests) behave exactly as they do on the website.
final class GameSchemeHandler: NSObject, WKURLSchemeHandler {
    static let scheme = "aeloria"
    static let startURL = URL(string: "aeloria://localhost/index.html")!

    private let root: URL

    init(root: URL) {
        self.root = root.standardizedFileURL
    }

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url else { return }
        var path = url.path
        if path.isEmpty || path == "/" { path = "/index.html" }
        let file = root.appendingPathComponent(String(path.dropFirst())).standardizedFileURL

        guard file.path.hasPrefix(root.path), let data = try? Data(contentsOf: file, options: .mappedIfSafe) else {
            let notFound = HTTPURLResponse(url: url, statusCode: 404, httpVersion: "HTTP/1.1", headerFields: ["Content-Type": "text/plain"])!
            task.didReceive(notFound)
            task.didReceive(Data())
            task.didFinish()
            return
        }

        var headers = [
            "Content-Type": Self.mimeType(for: file.pathExtension),
            "Accept-Ranges": "bytes",
            "Cache-Control": "no-cache",
            "Access-Control-Allow-Origin": "*",
        ]
        var body = data
        var status = 200
        if let range = task.request.value(forHTTPHeaderField: "Range"), let r = Self.byteRange(range, size: data.count) {
            body = data.subdata(in: r)
            status = 206
            headers["Content-Range"] = "bytes \(r.lowerBound)-\(r.upperBound - 1)/\(data.count)"
        }
        headers["Content-Length"] = String(body.count)

        task.didReceive(HTTPURLResponse(url: url, statusCode: status, httpVersion: "HTTP/1.1", headerFields: headers)!)
        task.didReceive(body)
        task.didFinish()
    }

    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}

    /// Parses "bytes=a-b", "bytes=a-" and "bytes=-n".
    private static func byteRange(_ header: String, size: Int) -> Range<Int>? {
        guard size > 0, header.hasPrefix("bytes=") else { return nil }
        let spec = header.dropFirst(6).split(separator: ",").first.map(String.init) ?? ""
        let parts = spec.split(separator: "-", omittingEmptySubsequences: false).map { String($0).trimmingCharacters(in: .whitespaces) }
        guard parts.count == 2 else { return nil }
        var start: Int, end: Int
        if parts[0].isEmpty {
            guard let n = Int(parts[1]), n > 0 else { return nil }
            start = max(0, size - n); end = size - 1
        } else {
            guard let s = Int(parts[0]) else { return nil }
            start = s; end = Int(parts[1]) ?? (size - 1)
        }
        end = min(end, size - 1)
        guard start <= end else { return nil }
        return start..<(end + 1)
    }

    static func mimeType(for ext: String) -> String {
        switch ext.lowercased() {
        case "html": return "text/html; charset=utf-8"
        case "js", "mjs": return "text/javascript; charset=utf-8"
        case "css": return "text/css; charset=utf-8"
        case "json": return "application/json"
        case "webmanifest": return "application/manifest+json"
        case "svg": return "image/svg+xml"
        case "webp": return "image/webp"
        case "png": return "image/png"
        case "jpg", "jpeg": return "image/jpeg"
        case "mp3": return "audio/mpeg"
        case "woff2": return "font/woff2"
        default: return UTType(filenameExtension: ext)?.preferredMIMEType ?? "application/octet-stream"
        }
    }
}
