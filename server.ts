/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Modality } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';
import { router, getAiClient, getApiKey } from './api/_lib/handlers.ts';

// Load environment variables (.env / .env.local)
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const distIndexPath = path.join(__dirname, 'dist', 'index.html');
const isDevRunner =
  process.env.npm_lifecycle_event === 'dev' ||
  process.argv.some((arg) => arg.includes('tsx'));
const isProd =
  process.env.NODE_ENV === 'production' ||
  (!isDevRunner && fs.existsSync(distIndexPath));
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Mount the server-side API endpoints
app.use(router);

// ---------------------------------------------------------------------------
// WEBSOCKET SERVER FOR GEMINI LIVE API (Real-Time Voice Streaming)
// ---------------------------------------------------------------------------

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const { pathname } = new URL(request.url || '', `http://${request.headers.host}`);
  if (pathname === '/api/gemini/live') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('Gemini Live WebSocket client connected');

  if (!getApiKey()) {
    clientWs.send(JSON.stringify({ error: 'GEMINI_API_KEY is not configured on the server.' }));
    clientWs.close();
    return;
  }

  try {
    const session = await getAiClient().live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction: 'You are an encouraging English pronunciation and language tutor for My VocaBloom.',
      },
      callbacks: {
        onmessage: (message) => {
          for (const part of message.serverContent?.modelTurn?.parts ?? []) {
            if (part.inlineData?.data) {
              clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
            }
            if (part.text) {
              clientWs.send(JSON.stringify({ text: part.text }));
            }
          }
          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ interrupted: true }));
          }
        },
        onclose: () => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.close();
          }
        },
        onerror: (err: any) => {
          console.error('Gemini Live session error:', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ error: err?.message || 'Gemini Live session error' }));
          }
        },
      },
    });

    clientWs.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.audio) {
          session.sendRealtimeInput({
            audio: { data: msg.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (msg.text) {
          session.sendRealtimeInput({
            text: msg.text,
          });
        }
      } catch (e) {
        console.error('Error forwarding message to Gemini Live:', e);
      }
    });

    clientWs.on('close', () => {
      try {
        session.close();
      } catch (e) {
        // session cleanup
      }
    });
  } catch (error: any) {
    console.error('Failed to connect to Gemini Live API:', error);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ error: error?.message || 'Failed to initialize Gemini Live API session' }));
      clientWs.close();
    }
  }
});

// ---------------------------------------------------------------------------
// VITE DEV MIDDLEWARE OR PRODUCTION STATIC SERVING
// ---------------------------------------------------------------------------

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`My VocaBloom server running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer();
