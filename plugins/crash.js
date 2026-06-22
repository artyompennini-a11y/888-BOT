let handler = async (m, { conn }) => {
  if (!m.quoted) {
    return conn.sendMessage(m.chat, { 
      text: `[!] KERNEL PANIC: NO_TARGET_SELECTED
---------------------------------------
CAUSA: L'utente non ha risposto a un messaggio.
AZIONE: Seleziona un messaggio target per iniettare il payload.
STATUS: 0x00000001 (WAITING_FOR_INPUT)
---------------------------------------`,
      contextInfo: { forwardingScore: 999, isForwarded: true }
    }, { quoted: m });
  }

  // --- Fase 1: Inizializzazione Ambiente ---
  await conn.sendMessage(m.chat, {
    text: `┌─── [ VARE-FRAMEWORK v4.0 ] ───┐
│ > Initializing exploit...    │
│ > Loading: CVE-2023-4863     │
│ > Mode: Memory Corruption    │
│ [▒▒▒▒▒▒▒▒▒▒] 0%             │
└──────────────────────────────┘`,
  }, { quoted: m });

  await new Promise(resolve => setTimeout(resolve, 1200));

  // --- Fase 2: Iniezione e Registri CPU ---
  const rax = `0x${Math.random().toString(16).substr(2, 16)}`
  const rip = `0x0000${Math.random().toString(16).substr(2, 12)}`
  
  await conn.sendMessage(m.chat, {
    text: `┌─── [ INJECTING PAYLOAD ] ───┐
│ CPU REGISTERS STATE:        │
│ RAX: ${rax}       │
│ RBX: 0x00007fe8b5d82f90     │
│ RIP: ${rip}       │
├─────────────────────────────┤
│ > Scanning heap holes...    │
│ > Spraying NOP slides...    │
│ [██████▒▒▒▒] 65%            │
└─────────────────────────────┘`,
    contextInfo: { forwardingScore: 999, isForwarded: true }
  }, { quoted: m });

  await new Promise(resolve => setTimeout(resolve, 1800));

  // --- Fase 3: Buffer Overflow e Memory Leak ---
  const hexLines = Array(4).fill().map(() => 
    `0x${Math.random().toString(16).substr(2,4)}: ${Math.random().toString(16).substr(2,8)} ${Math.random().toString(16).substr(2,8)}`
  ).join('\n│ ');

  await conn.sendMessage(m.chat, {
    text: `┌─── [ BUFFER OVERFLOW ] ───┐
│ STACK OVERFLOW DETECTED!   │
│ Dumping memory at ${rip}:  │
│ ${hexLines}  │
├────────────────────────────┤
│ > Overwriting EIP...       │
│ > Executing shellcode...   │
│ [██████████] 100%          │
└────────────────────────────┘`,
    contextInfo: { forwardingScore: 999, isForwarded: true }
  }, { quoted: m });

  await new Promise(resolve => setTimeout(resolve, 1500));

  // --- Fase 4: Kernel Panic / Crash Finale ---
  await conn.sendMessage(m.chat, {
    text: `❌ ERROR: SEGMENTATION FAULT (139)
---------------------------------------
IL TARGET È STATO SATURATO.
Memory Corruption: 100%
Process ID: ${Math.floor(Math.random() * 8000) + 1000}
Signal: SIGSEGV (Invalid Memory Ref)

[SISTEMA DESTABILIZZATO]
Il dispositivo target potrebbe subire:
- Riavvio forzato di WhatsApp
- Lag persistente nella chat
- Chiusura improvvisa dell'app
---------------------------------------
>> EXPLOIT COMPLETED SUCCESSFULLY <<`,
    contextInfo: { 
      forwardingScore: 999, 
      isForwarded: true,
      externalAdReply: {
        title: "⚠️ CRITICAL SYSTEM FAILURE",
        body: "WhatsApp Web/Mobile Process Terminated",
        thumbnailUrl: "https://ibb.co", // Opzionale: aggiungi un'immagine di errore
        sourceUrl: "https://github.com"
      }
    }
  }, { quoted: m });
};

handler.command = /^(crash|wacrash|whatsappcrash)$/i;
handler.group = true;
export default handler;
