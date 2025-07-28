"use client";
import { useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";
import { apiService } from "@/lib/api";

export default function ChatCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let socket: Socket;

    async function init() {
      const { count } = await apiService.countAllChatMessages()
      setCount(count)

      /* --- temps-réel --- */
      const user = await apiService.getCurrentUser();
      const events = await apiService.getEvents();

      socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3000');

      /* Rejoindre toutes les rooms */
      events.forEach((ev) =>
        socket.emit('joinEvent', { userId: user.id, eventId: ev.id })
      );

      /* Incrément quand un nouveau message est sauvegardé */
      socket.on('newMessage', () => setCount((c) => c + 1));
    }

    init();
    return () => { if (socket) socket.disconnect(); };
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>Messages chat :</span>
      <span className="text-xl font-bold">{count}</span>
    </div>
  );
} 