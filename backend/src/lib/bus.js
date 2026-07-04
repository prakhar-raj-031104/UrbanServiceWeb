// In-process event bus — lets routes broadcast events (e.g. new requests)
// to live admin-panel connections via SSE.
import { EventEmitter } from 'events';

export const bus = new EventEmitter();
bus.setMaxListeners(50);
