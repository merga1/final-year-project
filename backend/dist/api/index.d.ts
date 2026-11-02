import 'reflect-metadata';
import { IncomingMessage, ServerResponse } from 'http';
export default function handler(req: IncomingMessage, res: ServerResponse): Promise<void>;
