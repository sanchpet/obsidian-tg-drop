import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMultipart } from "./multipart.ts";

const note = "# Заметка\n\n**жирный** и [[ссылка]]\n";

test("fields and a UTF-8 file survive a standard multipart parser", async () => {
  const data = new TextEncoder().encode(note).buffer;
  const { body, contentType } = buildMultipart(
    { chat_id: "-1001", message_thread_id: "12" },
    { field: "document", filename: "Первая заметка.md", type: "text/markdown", data },
  );

  const form = await new Response(body, { headers: { "content-type": contentType } }).formData();

  assert.equal(form.get("chat_id"), "-1001");
  assert.equal(form.get("message_thread_id"), "12");
  const doc = form.get("document");
  assert.ok(doc instanceof File);
  assert.equal(doc.name, "Первая заметка.md");
  assert.equal(await doc.text(), note);
});

test("quotes and line breaks in a filename cannot break the header", () => {
  const { body } = buildMultipart(
    {},
    { field: "document", filename: 'a"b\r\nc.md', type: "text/markdown", data: new ArrayBuffer(0) },
    "B",
  );
  const head = new TextDecoder().decode(body);
  assert.match(head, /filename="a%22b%0D%0Ac\.md"/);
});
