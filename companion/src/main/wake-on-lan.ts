import dgram from 'node:dgram';

export interface WakeOnLanResult {
  ok: boolean;
  message: string;
}

export function createMagicPacket(macAddress: string): Buffer {
  const cleanMac = macAddress.replace(/[^0-9a-fA-F]/g, '');
  if (cleanMac.length !== 12) {
    throw new Error(`Invalid MAC address format: "${macAddress}". Expected 12 hexadecimal characters.`);
  }

  const macBytes = Buffer.from(cleanMac, 'hex');
  const packet = Buffer.alloc(6 + 16 * 6);

  // Magic packet format: 6 bytes of 0xFF followed by MAC address repeated 16 times
  packet.fill(0xff, 0, 6);
  for (let i = 0; i < 16; i++) {
    macBytes.copy(packet, 6 + i * 6, 0, 6);
  }

  return packet;
}

export async function sendWakeOnLan(
  macAddress: string,
  broadcastAddress = '255.255.255.255',
  port = 9
): Promise<WakeOnLanResult> {
  return new Promise((resolve) => {
    let packet: Buffer;
    try {
      packet = createMagicPacket(macAddress);
    } catch (err) {
      resolve({
        ok: false,
        message: err instanceof Error ? err.message : String(err)
      });
      return;
    }

    const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

    socket.once('error', (err) => {
      try {
        socket.close();
      } catch {
        // ignore
      }
      resolve({
        ok: false,
        message: `WoL socket error: ${err.message}`
      });
    });

    socket.bind(0, () => {
      socket.setBroadcast(true);
      socket.send(packet, 0, packet.length, port, broadcastAddress, (err) => {
        try {
          socket.close();
        } catch {
          // ignore
        }
        if (err) {
          resolve({
            ok: false,
            message: `Failed to send WoL magic packet: ${err.message}`
          });
        } else {
          resolve({
            ok: true,
            message: `Magic packet broadcasted to ${broadcastAddress}:${port} for MAC ${macAddress}`
          });
        }
      });
    });
  });
}
