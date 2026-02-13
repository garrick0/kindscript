'use client';

import { useState } from 'react';
import { Users, UserPlus, Crown, MessageCircle } from 'lucide-react';
import { cn } from '../../../../utils/cn';

interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'online' | 'offline';
  lastSeen?: string;
}

interface Comment {
  id: string;
  author: Collaborator;
  content: string;
  timestamp: string;
  resolved: boolean;
}

interface DocumentCollaborationProps {
  documentId?: string; // Platform passes documentId
  collaborators?: Collaborator[];
  comments?: Comment[];
  currentUser?: Collaborator;
  onInviteUser?: (email: string, role: string) => void;
  onChangeRole?: (userId: string, role: string) => void;
  onRemoveUser?: (userId: string) => void;
  onAddComment?: (content: string) => void;
  onResolveComment?: (commentId: string) => void;
  onClose?: () => void; // Platform passes onClose
  className?: string;
}

export function DocumentCollaboration({
  collaborators = [],
  comments = [],
  currentUser,
  onInviteUser,
  onChangeRole,
  onRemoveUser,
  onAddComment,
  onResolveComment,
  className
}: DocumentCollaborationProps) {
  const [activeTab, setActiveTab] = useState<'collaborators' | 'comments'>('collaborators');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [newComment, setNewComment] = useState('');

  const handleInvite = () => {
    if (inviteEmail.trim() && onInviteUser) {
      onInviteUser(inviteEmail.trim(), inviteRole);
      setInviteEmail('');
    }
  };

  const handleAddComment = () => {
    if (newComment.trim() && onAddComment) {
      onAddComment(newComment.trim());
      setNewComment('');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'editor': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={cn("bg-white border border-gray-200 rounded-lg", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('collaborators')}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
              activeTab === 'collaborators'
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <Users className="h-4 w-4" />
            Collaborators ({collaborators.length})
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
              activeTab === 'comments'
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <MessageCircle className="h-4 w-4" />
            Comments ({comments.filter(c => !c.resolved).length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'collaborators' ? (
          <div className="space-y-4">
            {/* Invite Section */}
            {onInviteUser && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Invite Collaborators</h3>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <button
                    onClick={handleInvite}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <UserPlus className="h-4 w-4" />
                    Invite
                  </button>
                </div>
              </div>
            )}

            {/* Collaborators List */}
            <div className="space-y-3">
              {collaborators.map(collaborator => (
                <div key={collaborator.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                  {/* Avatar */}
                  <div className="relative">
                    {collaborator.avatar ? (
                      <img
                        src={collaborator.avatar}
                        alt={collaborator.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white font-medium">
                        {getInitials(collaborator.name)}
                      </div>
                    )}
                    {collaborator.status === 'online' && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{collaborator.name}</span>
                      {collaborator.role === 'owner' && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {collaborator.email}
                      {collaborator.status === 'offline' && collaborator.lastSeen && (
                        <span className="ml-2">• Last seen {formatDate(collaborator.lastSeen)}</span>
                      )}
                    </div>
                  </div>

                  {/* Role & Actions */}
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-1 text-xs rounded-full",
                      getRoleColor(collaborator.role)
                    )}>
                      {collaborator.role}
                    </span>

                    {collaborator.id !== currentUser?.id && onChangeRole && (
                      <select
                        value={collaborator.role}
                        onChange={(e) => onChangeRole(collaborator.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                        {currentUser?.role === 'owner' && (
                          <option value="owner">Owner</option>
                        )}
                      </select>
                    )}

                    {collaborator.id !== currentUser?.id && onRemoveUser && (
                      <button
                        onClick={() => onRemoveUser(collaborator.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Add Comment */}
            {onAddComment && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Add Comment</h3>
                <div className="flex gap-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Leave a comment..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 self-start"
                  >
                    Comment
                  </button>
                </div>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-3">
              {comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No comments yet</p>
                </div>
              ) : (
                comments.map(comment => (
                  <div
                    key={comment.id}
                    className={cn(
                      "p-4 border rounded-lg",
                      comment.resolved
                        ? "border-gray-200 bg-gray-50"
                        : "border-gray-300 bg-white"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      {comment.author.avatar ? (
                        <img
                          src={comment.author.avatar}
                          alt={comment.author.name}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {getInitials(comment.author.name)}
                        </div>
                      )}

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {comment.author.name}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDate(comment.timestamp)}
                          </span>
                          {comment.resolved && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                              Resolved
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700">{comment.content}</p>
                      </div>

                      {/* Actions */}
                      {!comment.resolved && onResolveComment && (
                        <button
                          onClick={() => onResolveComment(comment.id)}
                          className="text-green-600 hover:text-green-700 text-sm"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export type { DocumentCollaborationProps, Collaborator, Comment };