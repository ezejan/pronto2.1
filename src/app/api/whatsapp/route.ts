import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { logError } from '@/utils/logError';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const client = twilio(accountSid, authToken);

// Número oficial de WhatsApp registrado
const from = 'whatsapp:+5491123276529';

// SID de plantillas aprobadas por WhatsApp
const SID_PEDIDO = 'HXa16dc8f6ebdea4cae19852a1b0de9a4f'; // pedido_recibido
const SID_RESPUESTA = 'HX35ed17d6f30d7dce83c1940e14538578'; // proveedor_respuesta

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { telefono, nombre, rubro, especialidad, zona, respuesta, pedidoId } =
      body;

    const esRespuesta = !!respuesta;
    const link = `https://prontoap.com/seguimiento/${pedidoId || ''}`;

    // Variables dinámicas según si es una respuesta o un nuevo pedido
    const variables = esRespuesta
      ? {
          1: nombre,
          2: rubro,
          3: especialidad,
          4: zona,
          5: respuesta?.nombreProveedor || '-',
          6: respuesta?.disponibilidad || '-',
          7: respuesta?.tiempoEstimado || '-',
          8: respuesta?.materialesIncluidos ? 'Sí' : 'No',
          9: `$${respuesta?.presupuesto || '-'}`,
          10: link,
        }
      : {
          1: nombre,
          2: rubro,
          3: especialidad,
          4: zona,
        };

    console.log('📦 Enviando mensaje con:', {
      telefono,
      contentSid: esRespuesta ? SID_RESPUESTA : SID_PEDIDO,
      contentVariables: variables,
    });

    const mensaje = await client.messages.create({
      from,
      to: `whatsapp:${telefono}`,
      contentSid: esRespuesta ? SID_RESPUESTA : SID_PEDIDO,
      contentVariables: JSON.stringify(variables),
    });

    return NextResponse.json({ success: true, mensaje });
  } catch (error) {
    logError(error, 'whatsapp');
    return NextResponse.json(
      { success: false, message: 'No se pudo enviar el mensaje' },
      { status: 500 },
    );
  }
}
