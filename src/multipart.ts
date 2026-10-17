export interface FilePart {
  field: string;
  filename: string;
  type: string;
  data: ArrayBuffer;
}

export interface Multipart {
  body: ArrayBuffer;
  contentType: string;
}

// Obsidian's requestUrl takes a raw body, not FormData, so the multipart
// payload is assembled by hand.
export function buildMultipart(
  fields: Record<string, string>,
  file: FilePart,
  boundary: string = randomBoundary(),
): Multipart {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  for (const [name, value] of Object.entries(fields)) {
    parts.push(
      enc.encode(
        `--${boundary}\r\nContent-Disposition: form-data; name="${quote(name)}"\r\n\r\n${value}\r\n`,
      ),
    );
  }
  parts.push(
    enc.encode(
      `--${boundary}\r\nContent-Disposition: form-data; name="${quote(file.field)}"; filename="${quote(file.filename)}"\r\nContent-Type: ${file.type}\r\n\r\n`,
    ),
  );
  parts.push(new Uint8Array(file.data));
  parts.push(enc.encode(`\r\n--${boundary}--\r\n`));

  const body = new Uint8Array(parts.reduce((n, p) => n + p.byteLength, 0));
  let offset = 0;
  for (const p of parts) {
    body.set(p, offset);
    offset += p.byteLength;
  }
  return { body: body.buffer, contentType: `multipart/form-data; boundary=${boundary}` };
}

// WHATWG form-data escaping for quoted header parameters.
function quote(s: string): string {
  return s.replace(/["\r\n]/g, (c) => (c === '"' ? "%22" : c === "\r" ? "%0D" : "%0A"));
}

function randomBoundary(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return "----tgdrop" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
