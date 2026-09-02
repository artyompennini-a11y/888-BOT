<div align="center">

# 🌙 888-BOT  
### ⚫ Next Generation WhatsApp Bot  
#### Minimal • Dark • Ultra Fast

<img src="https://qu.ax/Um17w" width="180"/>

---

### ⚡ Powered by AI • Built for Speed  
**JavaScript • Node.js • Python**

---

## 🔗 Official Links

### 🌐 Sito Ufficiale (Bottone Animato)

<a href="https://888bot.netlify.app" target="_blank">
  <img src="https://img.shields.io/badge/888BOT-SITO-000000?style=for-the-badge&logo=firefox&logoColor=white" 
       alt="Sito 888BOT"
       style="
         border-radius: 10px;
         animation: glow 1.4s infinite alternate;
       ">
</a>

<style>
@keyframes glow {
  from { filter: drop-shadow(0 0 2px #ffffff); }
  to   { filter: drop-shadow(0 0 10px #ffffff); }
}
</style>

---

[GitHub Repository](https://github.com/artyompennini-a11y/888-BOT)  
[WhatsApp Channel](https://whatsapp.com/channel/0029Vb8Y0igGufJ0xMYJmU40)  
[Instagram](https://instagram.com/arty.340)

---

### 🖤 Dark Badges

![Dark](https://img.shields.io/badge/Theme-Dark-000000?style=for-the-badge)
![Open Source](https://img.shields.io/badge/Open_Source-❤️-111?style=for-the-badge)
![Maintained](https://img.shields.io/badge/Maintained-Yes-222?style=for-the-badge)
![Ultra Fast](https://img.shields.io/badge/Speed-Ultra_Fast-000?style=for-the-badge)
![AI Powered](https://img.shields.io/badge/AI-Powered-222?style=for-the-badge)

</div>

---

# 🖤 ITALIANO — Installazione Rapida

## 📋 Prerequisiti
- Android 7.0+
- Termux **v0.119.1**
- Internet stabile
- GitHub

---

# 📱 STEP 1 — Termux (versione richiesta)

**Scarica SOLO questa versione:**

[Termux v0.119.1](https://www.mediafire.com/file/0npdmv51pnttps0/com.termux_0.119.1-119_minAPI21(arm64-v8a,armeabi-v7a,x86,x86_64)(nodpi)_apkmirror.com.apk/file)

---

# 🍴 STEP 2 — Fork del Repository

👉 https://github.com/artyompennini-a11y/888-BOT/fork

---

# ⚙️ STEP 3 — Configurazione

Modifica `config.js`:

- Inserisci il tuo numero WhatsApp  
- Salva

🔗 https://github.com/artyompennini-a11y/888-BOT/blob/main/config.js

---

# 💻 STEP 4 — Installazione su Termux

```bash
termux-setup-storage
pkg update && pkg upgrade -y
pkg install git nodejs ffmpeg imagemagick yarn -y

cd ~
git clone https://github.com/USERNAME/888-BOT.git
cd 888-BOT

yarn install
yarn start