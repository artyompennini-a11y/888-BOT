import fetch from 'node-fetch';
import { FormData, Blob } from 'formdata-node';
import { fileTypeFromBuffer } from 'file-type';

export default async (buffer) => {
  const type = await fileTypeFromBuffer(buffer);
  if (!type) throw new Error('Tipo file non riconosciuto');

  const { ext, mime } = type;
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mime }), `tmp.${ext}`);

  const res = await fetch('https://telegra.ph/upload', {   // <-- fix
    method: 'POST',
    body: form,
  });

  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

  const img = await res.json();
  if (img.error) throw new Error(img.error);

  if (!Array.isArray(img) || !img[0]?.src) {
    throw new Error('Risposta inattesa: ' + JSON.stringify(img));
  }

  return 'https://telegra.ph' + img[0].src;
};
