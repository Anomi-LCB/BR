// Simple substitution cipher + Base64 for invite codes
// We don't want heavy crypto libs on client side if possible, but for "High-End", we should use Web Crypto API.
// However, to keep invite codes short and URL-friendly, a custom obfuscation or lightweight encryption is better.
// Given constraints, I will implement a robust reversible obfuscator.

const CHAR_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const SHIFT = 7; // Caesar shift for simple obscurity

export function encryptInviteCode(groupId: string): string {
    // 1. Text to Base64 to handle any chars
    const base64 = btoa(encodeURIComponent(groupId));

    // 2. Simple Caesar Shift on the Base64 string to avoid obvious format
    let result = "";
    for (let i = 0; i < base64.length; i++) {
        const char = base64[i];
        const code = char.charCodeAt(0);
        result += String.fromCharCode(code + SHIFT);
    }

    // 3. URL Safe replacement
    return result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function decryptInviteCode(code: string): string | null {
    try {
        // 1. Restore URL Safe chars
        let recovered = code.replace(/-/g, '+').replace(/_/g, '/');

        // 2. Reverse Caesar Shift
        let base64 = "";
        for (let i = 0; i < recovered.length; i++) {
            const char = recovered[i];
            const codePoint = char.charCodeAt(0);
            base64 += String.fromCharCode(codePoint - SHIFT);
        }

        // 3. Base64 to Text
        return decodeURIComponent(atob(base64));
    } catch (e) {
        console.error("Invalid Invite Code", e);
        return null;
    }
}
