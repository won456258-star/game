// src/lib/chat-manager.ts (NEW FILE)
import { ChatEntry, Sender } from './types';
import { getChatPath } from './utils';

// --- MOCK for Node.js fs operations (실제 환경에서는 fs/promises 사용) ---
const mockFs = {
    existsSync: (p: string) => false, 
    readFileSync: (p: string) => '{"chat": []}',
    writeFileSync: (p: string, d: string) => { /* console.log(`[FS MOCK] Writing to ${p}`) */ }
};

export function saveChat(gameName: string, sender: Sender, text: string) {
    const filePath = getChatPath(gameName);
    let data: { chat: ChatEntry[] };

    if (mockFs.existsSync(filePath)) {
        try {
            data = JSON.parse(mockFs.readFileSync(filePath, 'utf-8'));
        } catch (e) {
            console.error(`Error parsing chat file, initializing: ${e}`);
            data = { chat: [] };
        }
    } else {
        data = { chat: [] };
    }

    const newEntry: ChatEntry = { from: sender, text: text };
    if (!Array.isArray(data.chat)) {
         data.chat = [];
    }
    data.chat.push(newEntry);

    try {
        mockFs.writeFileSync(filePath, JSON.stringify(data, null, 4));
        console.log(`[Chat] Saved: [${sender}] ${text.substring(0, 20)}...`);
    } catch (e) {
        console.error(`Error writing chat file: ${e}`);
    }
}

export function loadChat(gameName: string): { chat: ChatEntry[] } {
    // ... (loadChat 로직 생략)
    return { chat: [] };
}