"use client";
import { useState } from "react";
export function UserAvatar({ name, url }: { name: string; url?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  return (
    <span className="user-initial">
      {url && failed !== url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={`Foto profil ${name}`}
          onError={() => setFailed(url)}
        />
      ) : (
        name[0]
      )}
    </span>
  );
}
