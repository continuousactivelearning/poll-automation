/* eslint-disable @typescript-eslint/no-explicit-any */
import { WebSocket } from 'ws';
import { addConnection, removeConnection, getMeetingConnections, broadcastToMeeting } from '../transcription/services/connections';

describe('Connections Store', () => {
  let ws: WebSocket;

  beforeEach(() => {
    ws = new WebSocket('ws://localhost'); // Mock WebSocket
    (ws as any).isAlive = true;
  });

  it('should add and retrieve a connection', () => {
    addConnection(ws, 'meeting1', 'user1', 'host');
    const meeting = getMeetingConnections('meeting1');
    expect(meeting?.get('user1')?.role).toBe('host');
  });

  it('should remove a connection', () => {
    addConnection(ws, 'meeting1', 'user1', 'host');
    removeConnection(ws);
    expect(getMeetingConnections('meeting1')?.has('user1')).toBe(false);
  });

  it('should broadcast to meeting clients', () => {
    const spy = jest.spyOn(ws, 'send');
    addConnection(ws, 'meeting1', 'user1', 'host');
    broadcastToMeeting('meeting1', JSON.stringify({ type: 'test' }));
    expect(spy).toHaveBeenCalledWith('{"type":"test"}');
  });
});
