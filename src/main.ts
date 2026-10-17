import { App, Notice, Plugin, PluginSettingTab, Setting, TFile, requestUrl } from "obsidian";
import { buildMultipart } from "./multipart";

interface Settings {
  botToken: string;
  chatId: string;
  topicId: string;
}

const DEFAULTS: Settings = { botToken: "", chatId: "", topicId: "" };

export default class TelegramDrop extends Plugin {
  settings: Settings = { ...DEFAULTS };

  async onload(): Promise<void> {
    this.settings = { ...DEFAULTS, ...(await this.loadData()) };

    this.addCommand({
      id: "send-current-note",
      name: "Send current note",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || file.extension !== "md") return false;
        if (!checking) void this.send(file);
        return true;
      },
    });

    this.addRibbonIcon("send", "Send current note to Telegram", () => {
      const file = this.app.workspace.getActiveFile();
      if (file) void this.send(file);
      else new Notice("Telegram Drop: no open note");
    });

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (!(file instanceof TFile) || file.extension !== "md") return;
        menu.addItem((item) =>
          item.setTitle("Send to Telegram").setIcon("send").onClick(() => void this.send(file)),
        );
      }),
    );

    this.addSettingTab(new SettingsTab(this.app, this));
  }

  async send(file: TFile): Promise<void> {
    const { botToken, chatId, topicId } = this.settings;
    if (!botToken || !chatId) {
      new Notice("Telegram Drop: set the bot token and chat ID in settings");
      return;
    }

    const fields: Record<string, string> = { chat_id: chatId };
    if (topicId) fields.message_thread_id = topicId;
    const { body, contentType } = buildMultipart(fields, {
      field: "document",
      filename: file.name,
      type: "text/markdown",
      data: await this.app.vault.readBinary(file),
    });

    try {
      const res = await requestUrl({
        url: `https://api.telegram.org/bot${botToken}/sendDocument`,
        method: "POST",
        contentType,
        body,
        throw: false,
      });
      const reply = parseReply(res.text);
      if (reply.ok) new Notice(`Sent: ${file.name}`);
      else new Notice(`Telegram Drop: ${reply.description ?? `HTTP ${res.status}`}`, 10000);
    } catch (e) {
      // The token is part of the URL; keep it out of anything shown on screen.
      const msg = (e instanceof Error ? e.message : String(e)).split(botToken).join("<token>");
      new Notice(`Telegram Drop: ${msg}`, 10000);
    }
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}

function parseReply(text: string): { ok: boolean; description?: string } {
  try {
    return JSON.parse(text) as { ok: boolean; description?: string };
  } catch {
    return { ok: false };
  }
}

class SettingsTab extends PluginSettingTab {
  constructor(
    app: App,
    private readonly plugin: TelegramDrop,
  ) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Bot token")
      .setDesc("From @BotFather. Stored in this vault's plugin data, so keep the vault private.")
      .addText((text) => {
        text.inputEl.type = "password";
        text.setValue(this.plugin.settings.botToken).onChange(async (v) => {
          this.plugin.settings.botToken = v.trim();
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Chat ID")
      .setDesc("Numeric ID of the target chat, e.g. -100… for a supergroup. The bot must be a member.")
      .addText((text) =>
        text.setValue(this.plugin.settings.chatId).onChange(async (v) => {
          this.plugin.settings.chatId = v.trim();
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Topic ID")
      .setDesc("Optional forum topic to post into. Leave empty for the chat itself.")
      .addText((text) =>
        text.setValue(this.plugin.settings.topicId).onChange(async (v) => {
          this.plugin.settings.topicId = v.trim();
          await this.plugin.saveSettings();
        }),
      );
  }
}
