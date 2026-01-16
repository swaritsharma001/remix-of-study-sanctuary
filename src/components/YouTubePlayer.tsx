import React from 'react';
import { motion } from 'framer-motion';

interface YouTubePlayerProps {
  url: string;
  title: string;
}

const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ url, title }) => {
  const videoId = extractYouTubeId(url);

  if (!videoId) {
    return (
      <div className="aspect-video w-full rounded-2xl bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">Invalid YouTube URL</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="aspect-video w-full overflow-hidden rounded-2xl shadow-modal"
    >
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </motion.div>
  );
};

export default YouTubePlayer;
