import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';
import { ChatInfoPanel } from './ChatInfoPanel';
import { CreateGroupModal } from './CreateGroupModal';
import { NewDirectChatModal } from './NewDirectChatModal';
import { ProfileModal } from './ProfileModal';
import { MediaViewerModal } from './MediaViewerModal';
import { MessageMedia } from '../../types/chat';

interface ChatContainerProps {
  onOpenSetup: () => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ onOpenSetup }) => {
  const { activeConversation, activeConversationId, setActiveConversationId } = useChat();

  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showNewDirect, setShowNewDirect] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeMediaViewer, setActiveMediaViewer] = useState<MessageMedia | null>(null);

  return (
    <div className="flex-1 flex w-full h-[calc(100vh-61px)] overflow-hidden relative z-10">
      {/* Sidebar: Visible on desktop or when no conversation is active on mobile */}
      <div
        className={`${
          activeConversationId ? 'hidden md:flex' : 'flex'
        } w-full md:w-80 lg:w-96 h-full flex-shrink-0`}
      >
        <ChatSidebar
          onOpenCreateGroup={() => setShowCreateGroup(true)}
          onOpenNewDirect={() => setShowNewDirect(true)}
          onOpenProfile={() => setShowProfile(true)}
        />
      </div>

      {/* Main Chat Center: Visible when conversation selected or on desktop */}
      <div
        className={`${
          !activeConversationId ? 'hidden md:flex' : 'flex'
        } flex-1 h-full min-w-0`}
      >
        <ChatWindow
          onBackToSidebar={() => setActiveConversationId(null)}
          onToggleInfoPanel={() => setShowInfoPanel(!showInfoPanel)}
          onViewMedia={(media) => setActiveMediaViewer(media)}
        />
      </div>

      {/* Right Info Panel: Desktop inline or mobile overlay */}
      {showInfoPanel && activeConversation && (
        <div className="hidden lg:flex h-full flex-shrink-0">
          <ChatInfoPanel
            conversation={activeConversation}
            onClose={() => setShowInfoPanel(false)}
            onViewMedia={(media) => setActiveMediaViewer(media)}
          />
        </div>
      )}

      {/* Mobile Drawer for Info Panel */}
      {showInfoPanel && activeConversation && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/80 flex justify-end">
          <ChatInfoPanel
            conversation={activeConversation}
            onClose={() => setShowInfoPanel(false)}
            onViewMedia={(media) => setActiveMediaViewer(media)}
          />
        </div>
      )}

      {/* Modals */}
      {showCreateGroup && (
        <CreateGroupModal onClose={() => setShowCreateGroup(false)} />
      )}

      {showNewDirect && (
        <NewDirectChatModal onClose={() => setShowNewDirect(false)} />
      )}

      {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} />
      )}

      {activeMediaViewer && (
        <MediaViewerModal
          media={activeMediaViewer}
          onClose={() => setActiveMediaViewer(null)}
        />
      )}
    </div>
  );
};
