import twilio from 'twilio';

// src/firebase/sendWhatsapp.js

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

// El resto de tu código...

export const enviarWhatsApp = async (mensaje, numeroDestino) => {
  try {
    await client.messages.create({
      body: mensaje,
      from: 'whatsapp:+14155238886', // Este es el número sandbox de Twilio para WhatsApp
      to: `whatsapp:${numeroDestino}`,
    });
    console.log('WhatsApp enviado correctamente');
  } catch (error) {
    console.error('Error al enviar WhatsApp:', error);
  }
};
