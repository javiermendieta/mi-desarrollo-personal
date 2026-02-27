'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Bot,
  Send,
  Settings,
  User,
  Sparkles,
  BookOpen,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { AIProfile, AIConversation, ChatMessage } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIAssistant({ isOpen, onClose }: AIAssistantProps) {
  console.log('=== AIAssistant render ===', { isOpen });
  
  const {
    aiProfile,
    updateAIProfile,
    conversations,
    addConversation,
    addMessageToConversation,
    deleteConversation,
  } = useAppStore();

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Profile form
  const [profileForm, setProfileForm] = useState<AIProfile>(aiProfile);

  // Get active conversation
  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  // Initialize first conversation if none exists
  useEffect(() => {
    if (conversations.length === 0) {
      const newConv: AIConversation = {
        id: uuidv4(),
        title: 'Nueva conversación',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addConversation(newConv);
      setActiveConversationId(newConv.id);
    } else if (!activeConversationId) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId]);

  const sendMessage = async () => {
    if (!message.trim() || !activeConversationId || isLoading) return;

    console.log('=== Sending message ===', message);
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    addMessageToConversation(activeConversationId, userMessage);
    setMessage('');
    setIsLoading(true);

    try {
      // Get all messages for context
      const conv = conversations.find((c) => c.id === activeConversationId);
      const allMessages = [
        ...(conv?.messages || []),
        userMessage,
      ].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      console.log('=== Calling /api/chat ===', { messageCount: allMessages.length, profile: aiProfile });
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages,
          profile: aiProfile,
        }),
      });

      console.log('=== Response status ===', response.status);
      const data = await response.json();
      console.log('=== Response data ===', data);

      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: data.message || 'Lo siento, no pude procesar tu mensaje.',
        timestamp: new Date().toISOString(),
      };

      addMessageToConversation(activeConversationId, assistantMessage);
    } catch (error) {
      console.error('=== Error sending message ===', error);
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.',
        timestamp: new Date().toISOString(),
      };
      addMessageToConversation(activeConversationId, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewConversation = () => {
    const newConv: AIConversation = {
      id: uuidv4(),
      title: 'Nueva conversación',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addConversation(newConv);
    setActiveConversationId(newConv.id);
  };

  const saveProfile = () => {
    updateAIProfile(profileForm);
    setIsProfileDialogOpen(false);
  };

  const quickActions = [
    { label: 'Cita bíblica', prompt: 'Dame una cita bíblica para mi día' },
    { label: 'Motivación', prompt: 'Necesito motivación para hoy' },
    { label: 'Consejo', prompt: 'Dame un consejo de desarrollo personal' },
    { label: 'Gratitud', prompt: 'Ayúdame a reflexionar sobre la gratitud' },
  ];

  if (!isOpen) {
    console.log('=== AIAssistant not open, returning null ===');
    return null;
  }

  console.log('=== AIAssistant is OPEN, rendering panel ===');

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-[100]" 
        onClick={onClose}
        data-testid="ai-overlay"
      />
      <div 
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] bg-card shadow-xl z-[101] flex flex-col border-l"
        data-testid="ai-panel"
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <div>
              <h2 className="font-bold">Asistente AI</h2>
              <p className="text-xs text-muted-foreground">Tu compañero de desarrollo</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsProfileDialogOpen(true)}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {/* Conversations List */}
        {conversations.length > 1 && (
          <div className="p-2 border-b overflow-x-auto">
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={startNewConversation}
              >
                <Plus className="h-3 w-3" />
              </Button>
              {conversations.slice(0, 5).map((conv) => (
                <Button
                  key={conv.id}
                  variant={activeConversationId === conv.id ? 'default' : 'outline'}
                  size="sm"
                  className="max-w-[100px] truncate"
                  onClick={() => setActiveConversationId(conv.id)}
                >
                  {conv.title}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
          {activeConversation?.messages && activeConversation.messages.length > 0 ? (
            <div className="space-y-4">
              {activeConversation.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className="text-xs opacity-60 mt-1">
                      {format(new Date(msg.timestamp), 'HH:mm')}
                    </p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">
                ¡Hola! Soy tu asistente personal.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    size="sm"
                    onClick={() => setMessage(action.prompt)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje..."
              disabled={isLoading}
            />
            <Button onClick={sendMessage} disabled={!message.trim() || isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurar Perfil del Asistente
            </DialogTitle>
            <DialogDescription>
              Comparte información sobre ti para que el asistente pueda conocerte mejor y ofrecerte consejos personalizados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Personalidad</Label>
              <Textarea
                value={profileForm.personality}
                onChange={(e) => setProfileForm({ ...profileForm, personality: e.target.value })}
                placeholder="Describe tu personalidad, cómo eres, qué te caracteriza..."
                rows={3}
              />
            </div>
            <div>
              <Label>Objetivos de vida</Label>
              <Textarea
                value={profileForm.lifeGoals}
                onChange={(e) => setProfileForm({ ...profileForm, lifeGoals: e.target.value })}
                placeholder="¿Cuáles son tus metas y sueños más importantes?"
                rows={3}
              />
            </div>
            <div>
              <Label>Desafíos actuales</Label>
              <Textarea
                value={profileForm.currentChallenges}
                onChange={(e) => setProfileForm({ ...profileForm, currentChallenges: e.target.value })}
                placeholder="¿Qué obstáculos o dificultades estás enfrentando?"
                rows={3}
              />
            </div>
            <div>
              <Label>Valores</Label>
              <Textarea
                value={profileForm.values}
                onChange={(e) => setProfileForm({ ...profileForm, values: e.target.value })}
                placeholder="¿Qué valores guían tu vida?"
                rows={2}
              />
            </div>
            <div>
              <Label>Intereses</Label>
              <Textarea
                value={profileForm.interests}
                onChange={(e) => setProfileForm({ ...profileForm, interests: e.target.value })}
                placeholder="¿Qué te apasiona? ¿Qué te gusta hacer?"
                rows={2}
              />
            </div>
            <div>
              <Label>Información adicional</Label>
              <Textarea
                value={profileForm.additionalInfo || ''}
                onChange={(e) => setProfileForm({ ...profileForm, additionalInfo: e.target.value })}
                placeholder="Cualquier otra cosa que quieras que el asistente sepa..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProfileDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveProfile}>
              Guardar Perfil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
