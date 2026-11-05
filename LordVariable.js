// Extensión de TurboWarp: Tutor de matemáticas con Claude
// Cárgala en TurboWarp: Extensiones > Extensión personalizada > Archivo, y marca "Ejecutar sin sandbox".
(function (Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('Carga esta extensión sin sandbox (unsandboxed).');
  }

  const INSTRUCCIONES =
    'Eres un tutor de matemáticas para un estudiante de preparatoria o escuela técnica (español de México, tono amable y cercano). ' +
    'Reglas: 1) Solo hablas de matemáticas; si preguntan otra cosa, redirige con amabilidad. ' +
    '2) NO des la solución completa de entrada: guía con UN paso o pista a la vez y pídele al estudiante que lo intente. ' +
    '3) Si el estudiante responde, revisa si está bien; si se equivocó, señala dónde sin regañar y da otra pista. ' +
    '4) Solo muestra la solución completa si la pide o si ya intentó varias veces y sigue trabado. ' +
    '5) Respuestas cortas, texto plano sin markdown ni asteriscos.';

  let apiKey = '';      // se pide al usar el bloque; no se guarda en el proyecto
  let historial = [];   // la IA no recuerda nada: se le manda la conversación cada vez

  class TutorClaude {
    getInfo() {
      return {
        id: 'tutorclaude',
        name: 'Tutor Claude',
        color1: '#4f46e5',
        blocks: [
          {
            opcode: 'preguntar',
            blockType: Scratch.BlockType.REPORTER,
            text: 'preguntar a Claude [TEXTO]',
            arguments: {
              TEXTO: { type: Scratch.ArgumentType.STRING, defaultValue: '2x+3=11' }
            }
          },
          {
            opcode: 'olvidar',
            blockType: Scratch.BlockType.COMMAND,
            text: 'olvidar la conversación'
          }
        ]
      };
    }

    async preguntar(args) {
      if (!apiKey) {
        apiKey = (prompt('Pega tu clave de API de Anthropic:') || '').trim();
      }
      if (!apiKey) return 'Falta la clave de API.';

      historial.push({ role: 'user', content: String(args.TEXTO) });
      const mensajes = historial.slice(-12);
      if (mensajes[0].role !== 'user') mensajes.shift();

      try {
        const r = await Scratch.fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-5-5',
            max_tokens: 400,
            system: INSTRUCCIONES,
            messages: mensajes
          })
        });
        const datos = await r.json();
        if (!r.ok) {
          if (r.status === 401) apiKey = '';
          throw new Error((datos.error && datos.error.message) || r.status);
        }
        const texto = datos.content.filter(b => b.type === 'text').map(b => b.text).join('');
        historial.push({ role: 'assistant', content: texto });
        return texto;
      } catch (e) {
        historial.pop();
        return 'Error: ' + e.message;
      }
    }

    olvidar() {
      historial = [];
    }
  }

  Scratch.extensions.register(new TutorClaude());
})(Scratch);
