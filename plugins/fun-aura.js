import { createCanvas } from 'canvas';
import crypto from 'crypto';

let handler = async (m, { conn }) => {
  try {
    let target = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : 
                 (m.quoted && m.quoted.sender ? m.quoted.sender : m.sender);

    let rawName = conn.getName(target);
    let cleanName = rawName.replace(/[^\x00-\x7F]/g, "").trim(); 
    if (!cleanName || cleanName.length < 1) {
      cleanName = target.split('@')[0]; 
    }
    
    await m.reply('🌀 *Sincronizzazione biometrica in corso...*');

    const auraValue = Math.floor(Math.random() * 1000000); 

    let rank, color;
    if (auraValue >= 900000) { rank = "DIVINITÀ"; color = "#FFD700"; }
    else if (auraValue >= 750000) { rank = "ELITE"; color = "#A020F0"; }
    else if (auraValue >= 500000) { rank = "CAMPIONE"; color = "#FF4500"; }
    else if (auraValue >= 250000) { rank = "GUERRIERO"; color = "#00F2FF"; }
    else { rank = "RECLUTA"; color = "#7FFF00"; }

    const width = 1000;
    const height = 560;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#0a0b14';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(0, 242, 255, 0.04)';
    ctx.lineWidth = 1;
    for(let i=0; i<width; i+=45) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,height); ctx.stroke(); }
    for(let i=0; i<height; i+=45) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(width,i); ctx.stroke(); }

    ctx.shadowBlur = 20;
    ctx.shadowColor = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 10;
    ctx.strokeRect(30, 30, width - 60, height - 60);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 35px sans-serif';
    ctx.fillText('AURA SYSTEM IDENTIFICATION', 70, 85);
    ctx.fillStyle = color;
    ctx.fillRect(70, 105, 400, 4);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '28px sans-serif';
    ctx.fillText('SUBJECT IDENTIFIED:', 70, 160);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 45px sans-serif';
    ctx.fillText(cleanName.toUpperCase(), 70, 210);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = 'bold 25px sans-serif';
    ctx.fillText('POWER POINTS', 75, 275);

    const formattedAura = auraValue.toLocaleString('it-IT');
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    ctx.font = 'bold 140px sans-serif';
    ctx.fillText(formattedAura, 70, 390);
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(70, 420, 860, 40, 5);
    ctx.fill();

    const barWidth = (auraValue / 1000000) * 860;
    const grad = ctx.createLinearGradient(70, 0, 70 + barWidth, 0);
    grad.addColorStop(0, color);
    grad.addColorStop(1, '#ffffff');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(70, 420, Math.max(barWidth, 15), 40, 5);
    ctx.fill();

    ctx.textAlign = 'right';
    ctx.font = 'italic bold 75px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(rank, 930, 510);

    const buffer = canvas.toBuffer();
 
    await conn.sendMessage(m.chat, { 
      image: buffer, 
      caption: `✅ *Analisi Completata*\n👤 *User:* @${target.split('@')[0]}\n📊 *Aura:* ${formattedAura}\n🏆 *Rank:* ${rank}`,
      mentions: [target] 
    }, { quoted: m });

  } catch (e) {
    console.error(e);
    m.reply('❌ Errore critico nel modulo Canvas.');
  }
};

handler.help = ['aura'];
handler.tags = ['giochi'];
handler.command = /^(aura)$/i;
handler.group = true;

export default handler;
