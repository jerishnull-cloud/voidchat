import React from 'react';
import { X, Download, ExternalLink } from 'lucide-react';
import { MessageMedia } from '../../types/chat';
import { sounds } from '../../lib/sounds';

interface MediaViewerModalProps {
  media: MessageMedia;
  onClose: () => void;
}

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({ media, onClose }) => {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center rounded-2xl overflow-hidden border border-[#B026FF]/40 shadow-[0_0_50px_rgba(176,38,255,0.4)] bg-[#050507]"
      >
        {/* Top bar */}
        <div className="w-full flex items-center justify-between p-3 bg-[#100B18]/90 border-b border-[#B026FF]/20 text-xs font-tech text-white">
          <span className="truncate max-w-xs">{media.fileName || 'Void Holo-Transmission'}</span>
          <div className="flex items-center gap-3">
            <a
              href={media.url}
              download={media.fileName || 'transmission'}
              className="p-1.5 rounded-lg hover:bg-white/10 text-[#A1A1AA] hover:text-white transition-colors"
              title="Download File"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg hover:bg-white/10 text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Media Content */}
        <div className="p-2 flex items-center justify-center max-h-[80vh] overflow-hidden">
          {media.mimeType?.startsWith('video/') ? (
            <video src={media.url} controls autoPlay className="max-h-[75vh] max-w-full rounded-lg" />
          ) : (
            <img
              src={media.url}
              alt="Transmission"
              className="max-h-[75vh] max-w-full object-contain rounded-lg"
            />
          )}
        </div>
      </div>
    </div>
  );
};
