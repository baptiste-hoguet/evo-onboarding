"use client";

interface VideoEmbedProps {
  url: string;
}

function getEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch =
    url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/) ;
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`;
  }

  // Vimeo
  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  // If already an embed URL, return as-is
  if (url.includes("embed") || url.includes("player")) {
    return url;
  }

  return null;
}

export function VideoEmbed({ url }: VideoEmbedProps) {
  const embedUrl = getEmbedUrl(url);

  if (!embedUrl) {
    return (
      <div className="aspect-video bg-[#111827] border border-[#1E2D45] rounded-xl flex items-center justify-center">
        <p className="text-[#94A3B8]">URL de video invalide</p>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-[#0A0F1E] rounded-xl overflow-hidden border border-[#1E2D45]">
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Video de bienvenue"
      />
    </div>
  );
}
