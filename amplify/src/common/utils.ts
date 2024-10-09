import { Message } from "./enums";

export function parseMessage(message: string): Message | undefined {
    try {
        return JSON.parse(message) as Message;
    } catch (e) {
        console.log(`Error parsing message: ${message}`);
        return undefined;
    }
}

export function stringifyMessage(message: Message): string {
    return JSON.stringify(message);
}