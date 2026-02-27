'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FolderKanban, Plus, Search, MoreVertical, Calendar, CheckCircle2, Clock,
  AlertCircle, Play, Pause, Trash2, Edit, ListTodo, FileText, Video,
  Users, Building, ExternalLink, Upload, Download, X,
  Bell, BellRing, Instagram, Linkedin, Twitter, Facebook, TrendingUp,
  DollarSign, Target, Eye, ChevronLeft, ChevronRight, GripVertical, FileSpreadsheet, File,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { 
  Project, ProjectTask, Milestone, ProjectStatus, ProjectPriority, 
  TaskStatus, ProjectType, ClientInfo, ProjectDocument, ProjectMeeting,
  SocialMediaPost, CommercialLead, ProjectAlert,
} from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { format, differenceInDays, isPast, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const statusConfig: Record<ProjectStatus, { label: string; color: string }> = {
  planning: { label: 'Planificación', color: 'bg-gray-500' },
  active: { label: 'Activo', color: 'bg-blue-500' },
  paused: { label: 'Pausado', color: 'bg-yellow-500' },
  completed: { label: 'Completado', color: 'bg-green-500' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500' },
};

const priorityConfig: Record<ProjectPriority, { label: string; color: string }> = {
  low: { label: 'Baja', color: 'text-gray-500' },
  medium: { label: 'Media', color: 'text-blue-500' },
  high: { label: 'Alta', color: 'text-orange-500' },
  urgent: { label: 'Urgente', color: 'text-red-500' },
};

const taskStatusConfig: Record<TaskStatus, { label: string; color: string }> = {
  todo: { label: 'Por hacer', color: 'bg-gray-200 text-gray-700' },
  'in-progress': { label: 'En progreso', color: 'bg-blue-100 text-blue-700' },
  review: { label: 'Revisión', color: 'bg-yellow-100 text-yellow-700' },
  done: { label: 'Hecho', color: 'bg-green-100 text-green-700' },
};

const meetingTypeConfig = {
  kickoff: { label: 'Kickoff', color: 'bg-purple-100 text-purple-700' },
  followup: { label: 'Seguimiento', color: 'bg-blue-100 text-blue-700' },
  review: { label: 'Revisión', color: 'bg-yellow-100 text-yellow-700' },
  delivery: { label: 'Entrega', color: 'bg-green-100 text-green-700' },
  other: { label: 'Otra', color: 'bg-gray-100 text-gray-700' },
};

const leadStatusConfig = {
  new: { label: 'Nuevo', color: 'bg-blue-100 text-blue-700', borderColor: 'border-blue-300' },
  contacted: { label: 'Contactado', color: 'bg-purple-100 text-purple-700', borderColor: 'border-purple-300' },
  qualified: { label: 'Calificado', color: 'bg-yellow-100 text-yellow-700', borderColor: 'border-yellow-300' },
  proposal: { label: 'Propuesta', color: 'bg-orange-100 text-orange-700', borderColor: 'border-orange-300' },
  negotiation: { label: 'Negociación', color: 'bg-pink-100 text-pink-700', borderColor: 'border-pink-300' },
  won: { label: 'Ganado', color: 'bg-green-100 text-green-700', borderColor: 'border-green-300' },
  lost: { label: 'Perdido', color: 'bg-red-100 text-red-700', borderColor: 'border-red-300' },
};

const platformConfig = {
  instagram: { label: 'Instagram', icon: Instagram, color: 'text-pink-500' },
  linkedin: { label: 'LinkedIn', icon: Linkedin, color: 'text-blue-600' },
  twitter: { label: 'Twitter/X', icon: Twitter, color: 'text-sky-500' },
  facebook: { label: 'Facebook', icon: Facebook, color: 'text-blue-500' },
  youtube: { label: 'YouTube', icon: Video, color: 'text-red-500' },
  tiktok: { label: 'TikTok', icon: Video, color: 'text-black' },
  other: { label: 'Otro', icon: ExternalLink, color: 'text-gray-500' },
};

const postStatusConfig = {
  idea: { label: 'Idea', color: 'bg-gray-100 text-gray-700' },
  draft: { label: 'Borrador', color: 'bg-yellow-100 text-yellow-700' },
  scheduled: { label: 'Programado', color: 'bg-blue-100 text-blue-700' },
  published: { label: 'Publicado', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};

const projectColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

type MainTab = 'clients' | 'business' | 'calendar';

// Draggable Lead Card Component
function DraggableLeadCard({ 
  lead, 
  onEdit, 
  onDelete 
}: { 
  lead: CommercialLead; 
  onEdit: () => void; 
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "cursor-grab active:cursor-grabbing transition-shadow",
        isDragging && "shadow-lg ring-2 ring-primary"
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <button {...attributes} {...listeners} className="mt-1 cursor-grab text-muted-foreground hover:text-foreground">
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="font-medium truncate">{lead.name}</p>
                {lead.company && <p className="text-sm text-muted-foreground truncate">{lead.company}</p>}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={onEdit}><Edit className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                  <DropdownMenuItem onClick={onDelete} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Eliminar</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {lead.value && (
              <p className="text-sm font-semibold text-green-600 mt-1">${lead.value.toLocaleString()}</p>
            )}
            {lead.nextFollowUp && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(parseISO(lead.nextFollowUp), 'd MMM', { locale: es })}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Droppable Pipeline Column Component
function DroppableColumn({ 
  stage, 
  config, 
  stageLeads, 
  stageValue,
  onEditLead,
  onDeleteLead
}: { 
  stage: CommercialLead['status'];
  config: { label: string; color: string; borderColor: string };
  stageLeads: CommercialLead[];
  stageValue: number;
  onEditLead: (lead: CommercialLead) => void;
  onDeleteLead: (leadId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 w-72 min-h-[200px] rounded-lg transition-colors",
        isOver && "bg-primary/5 ring-2 ring-primary/30"
      )}
    >
      {/* Stage Header */}
      <div className={cn("mb-3 p-3 rounded-lg border-2", config.color, config.borderColor)}>
        <div className="flex items-center justify-between">
          <Badge className={config.color}>{config.label}</Badge>
          <Badge variant="secondary">{stageLeads.length}</Badge>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-semibold">${stageValue.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground">{stageLeads.length} leads</span>
        </div>
      </div>

      {/* Leads List */}
      <div className="space-y-2 min-h-[100px]">
        {stageLeads.map((lead) => (
          <DraggableLeadCard
            key={lead.id}
            lead={lead}
            onEdit={() => onEditLead(lead)}
            onDelete={() => onDeleteLead(lead.id)}
          />
        ))}
        {stageLeads.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
            Arrastra leads aquí
          </div>
        )}
      </div>
    </div>
  );
}

export function ProjectsModule() {
  const { 
    projects, addProject, updateProject, deleteProject, 
    addTaskToProject, updateTaskInProject, deleteTaskFromProject, 
    addMilestoneToProject, updateMilestoneInProject, deleteMilestoneFromProject,
    addDocumentToProject, updateDocumentInProject, deleteDocumentFromProject,
    addMeetingToProject, updateMeetingInProject, deleteMeetingFromProject,
    socialMediaPosts, addSocialMediaPost, updateSocialMediaPost, deleteSocialMediaPost,
    commercialLeads, addCommercialLead, updateCommercialLead, deleteCommercialLead,
    projectAlerts, dismissProjectAlert,
  } = useAppStore();

  const [mainTab, setMainTab] = useState<MainTab>('clients');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'all'>('all');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  
  // Project dialogs
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isProjectDetailOpen, setIsProjectDetailOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  // Task & Milestone dialogs
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isMilestoneDialogOpen, setIsMilestoneDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  
  // Document & Meeting dialogs
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [isMeetingDialogOpen, setIsMeetingDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<ProjectDocument | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<ProjectMeeting | null>(null);
  const [detailTab, setDetailTab] = useState<string>('overview');
  
  // Document viewer
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<ProjectDocument | null>(null);
  
  // Social Media & Leads dialogs
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialMediaPost | null>(null);
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<CommercialLead | null>(null);

  // Drag and drop
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Monthly goals (stored in localStorage via state)
  const [monthlyLeadGoal, setMonthlyLeadGoal] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('monthlyLeadGoal') || '10');
    }
    return 10;
  });
  const [monthlyBillingGoal, setMonthlyBillingGoal] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('monthlyBillingGoal') || '50000');
    }
    return 50000;
  });

  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Forms
  const [projectForm, setProjectForm] = useState({
    name: '', description: '', type: 'client' as ProjectType, status: 'planning' as ProjectStatus, 
    priority: 'medium' as ProjectPriority, color: projectColors[0], startDate: '', deadline: '', tags: '',
    clientName: '', clientCompany: '', clientEmail: '', clientPhone: '', clientIndustry: '', clientNotes: '',
  });

  const [taskForm, setTaskForm] = useState({
    title: '', description: '', status: 'todo' as TaskStatus, priority: 'medium' as 'low' | 'medium' | 'high', dueDate: '',
  });

  const [milestoneForm, setMilestoneForm] = useState({
    title: '', description: '', dueDate: '',
  });

  const [documentForm, setDocumentForm] = useState({
    name: '', type: 'informe', description: '', date: format(new Date(), 'yyyy-MM-dd'), 
    version: '1.0', status: 'draft' as 'draft' | 'review' | 'final', fileName: '', fileData: '', fileSize: 0,
  });

  const [meetingForm, setMeetingForm] = useState({
    title: '', date: format(new Date(), 'yyyy-MM-dd'), time: '10:00', duration: 60,
    type: 'followup' as 'kickoff' | 'followup' | 'review' | 'delivery' | 'other',
    agenda: '', attendees: '', notes: '', status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled',
  });

  const [postForm, setPostForm] = useState({
    platform: 'instagram' as SocialMediaPost['platform'],
    content: '', hashtags: '', scheduledDate: '', scheduledTime: '', status: 'idea' as SocialMediaPost['status'], notes: '',
  });

  const [leadForm, setLeadForm] = useState({
    name: '', company: '', email: '', phone: '', source: '', status: 'new' as CommercialLead['status'],
    value: '', probability: '50', notes: '', nextFollowUp: '',
  });

  // Save goals to localStorage
  useEffect(() => {
    localStorage.setItem('monthlyLeadGoal', monthlyLeadGoal.toString());
  }, [monthlyLeadGoal]);

  useEffect(() => {
    localStorage.setItem('monthlyBillingGoal', monthlyBillingGoal.toString());
  }, [monthlyBillingGoal]);

  // Computed values
  const clientProjects = useMemo(() => projects.filter(p => p.type === 'client' || !p.type), [projects]);
  const internalProjects = useMemo(() => projects.filter(p => p.type === 'internal'), [projects]);

  const filteredProjects = useMemo(() => {
    return clientProjects.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.client?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.client?.company?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [clientProjects, searchQuery, filterStatus]);

  // Monthly stats for leads
  const currentMonth = format(new Date(), 'yyyy-MM');
  const monthlyStats = useMemo(() => {
    const monthLeads = commercialLeads.filter(l => l.createdAt.startsWith(currentMonth));
    const totalLeads = monthLeads.length;
    const totalValue = monthLeads.reduce((sum, l) => sum + (l.value || 0), 0);
    const wonLeads = commercialLeads.filter(l => l.status === 'won' && l.updatedAt?.startsWith(currentMonth));
    const wonValue = wonLeads.reduce((sum, l) => sum + (l.value || 0), 0);
    const contactedLeads = commercialLeads.filter(l => ['contacted', 'qualified', 'proposal', 'negotiation', 'won'].includes(l.status));
    
    return {
      totalLeads,
      totalValue,
      wonValue,
      wonCount: wonLeads.length,
      contactedCount: contactedLeads.length,
      leadProgress: Math.min(100, Math.round((totalLeads / monthlyLeadGoal) * 100)),
      billingProgress: Math.min(100, Math.round((wonValue / monthlyBillingGoal) * 100)),
    };
  }, [commercialLeads, currentMonth, monthlyLeadGoal, monthlyBillingGoal]);

  // Generate alerts
  const activeAlerts = useMemo(() => {
    const alerts: { id: string; type: string; title: string; description: string; date: string; color: string; projectId?: string; leadId?: string }[] = [];
    const today = new Date();
    const threeDaysLater = addDays(today, 3);
    const sevenDaysLater = addDays(today, 7);

    projects.forEach(project => {
      (project.meetings || []).forEach(meeting => {
        if (meeting.status === 'scheduled' && meeting.date) {
          const meetingDate = parseISO(meeting.date);
          if (!isPast(meetingDate) && meetingDate <= threeDaysLater) {
            alerts.push({
              id: `meeting-${meeting.id}`,
              type: 'meeting',
              title: `Reunión: ${meeting.title}`,
              description: `${project.name}${meeting.time ? ` - ${meeting.time}` : ''}`,
              date: meeting.date,
              color: 'bg-purple-500',
              projectId: project.id,
            });
          }
        }
      });
    });

    projects.forEach(project => {
      if (project.deadline && project.status !== 'completed') {
        const deadlineDate = parseISO(project.deadline);
        if (!isPast(deadlineDate) && deadlineDate <= sevenDaysLater) {
          alerts.push({
            id: `deadline-${project.id}`,
            type: 'deadline',
            title: `Deadline: ${project.name}`,
            description: `Vence en ${differenceInDays(deadlineDate, today)} días`,
            date: project.deadline,
            color: 'bg-red-500',
            projectId: project.id,
          });
        } else if (isPast(deadlineDate)) {
          alerts.push({
            id: `deadline-overdue-${project.id}`,
            type: 'deadline',
            title: `Vencido: ${project.name}`,
            description: `Venció hace ${Math.abs(differenceInDays(deadlineDate, today))} días`,
            date: project.deadline,
            color: 'bg-red-700',
            projectId: project.id,
          });
        }
      }
    });

    commercialLeads.forEach(lead => {
      if (lead.nextFollowUp && !['won', 'lost'].includes(lead.status)) {
        const followUpDate = parseISO(lead.nextFollowUp);
        if (isPast(followUpDate) || isSameDay(followUpDate, today)) {
          alerts.push({
            id: `followup-${lead.id}`,
            type: 'followup',
            title: `Seguimiento: ${lead.name}`,
            description: lead.company || lead.source || '',
            date: lead.nextFollowUp,
            color: 'bg-orange-500',
            leadId: lead.id,
          });
        }
      }
    });

    socialMediaPosts.forEach(post => {
      if (post.status === 'scheduled' && post.scheduledDate) {
        const postDate = parseISO(post.scheduledDate);
        if (!isPast(postDate) && postDate <= threeDaysLater) {
          alerts.push({
            id: `post-${post.id}`,
            type: 'post',
            title: `Post programado: ${platformConfig[post.platform].label}`,
            description: post.content.substring(0, 50) + (post.content.length > 50 ? '...' : ''),
            date: post.scheduledDate,
            color: 'bg-blue-500',
          });
        }
      }
    });

    return alerts.filter(a => !projectAlerts.find(pa => pa.id === a.id && pa.isDismissed));
  }, [projects, commercialLeads, socialMediaPosts, projectAlerts]);

  // Project CRUD
  const openNewProjectDialog = (type: ProjectType = 'client') => {
    setEditingProject(null);
    setProjectForm({
      name: '', description: '', type, status: 'planning', priority: 'medium', 
      color: projectColors[0], startDate: '', deadline: '', tags: '',
      clientName: '', clientCompany: '', clientEmail: '', clientPhone: '', clientIndustry: '', clientNotes: '',
    });
    setIsProjectDialogOpen(true);
  };

  const openEditProjectDialog = (project: Project) => {
    setEditingProject(project);
    setProjectForm({
      name: project.name, description: project.description || '', type: project.type || 'client', status: project.status,
      priority: project.priority, color: project.color, startDate: project.startDate || '', 
      deadline: project.deadline || '', tags: project.tags.join(', '),
      clientName: project.client?.name || '', clientCompany: project.client?.company || '',
      clientEmail: project.client?.email || '', clientPhone: project.client?.phone || '',
      clientIndustry: project.client?.industry || '', clientNotes: project.client?.notes || '',
    });
    setIsProjectDialogOpen(true);
  };

  const saveProject = () => {
    if (!projectForm.name.trim()) return;
    
    const clientInfo: ClientInfo | undefined = projectForm.type === 'client' ? {
      name: projectForm.clientName || projectForm.name,
      company: projectForm.clientCompany || undefined,
      email: projectForm.clientEmail || undefined,
      phone: projectForm.clientPhone || undefined,
      industry: projectForm.clientIndustry || undefined,
      notes: projectForm.clientNotes || undefined,
    } : undefined;

    const projectData: Project = {
      id: editingProject?.id || uuidv4(),
      name: projectForm.name.trim(), description: projectForm.description.trim() || undefined,
      type: projectForm.type, status: projectForm.status, priority: projectForm.priority, color: projectForm.color,
      startDate: projectForm.startDate || undefined, deadline: projectForm.deadline || undefined,
      progress: editingProject?.progress || 0, 
      tasks: editingProject?.tasks || [], milestones: editingProject?.milestones || [],
      documents: editingProject?.documents || [], meetings: editingProject?.meetings || [],
      tags: projectForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
      notes: editingProject?.notes, links: editingProject?.links || [], files: editingProject?.files || [],
      client: clientInfo,
      createdAt: editingProject?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    
    if (editingProject) updateProject(editingProject.id, projectData);
    else addProject(projectData);
    setIsProjectDialogOpen(false);
  };

  const openProjectDetail = (project: Project) => {
    setSelectedProject(project);
    setDetailTab('overview');
    setIsProjectDetailOpen(true);
  };

  // Task CRUD
  const openNewTaskDialog = () => {
    setEditingTask(null);
    setTaskForm({ title: '', description: '', status: 'todo', priority: 'medium', dueDate: '' });
    setIsTaskDialogOpen(true);
  };

  const saveTask = () => {
    if (!selectedProject || !taskForm.title.trim()) return;
    const taskData: ProjectTask = {
      id: editingTask?.id || uuidv4(),
      title: taskForm.title.trim(), description: taskForm.description.trim() || undefined,
      status: taskForm.status, priority: taskForm.priority, dueDate: taskForm.dueDate || undefined,
      tags: editingTask?.tags || [], subtasks: editingTask?.subtasks || [],
      createdAt: editingTask?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    if (editingTask) updateTaskInProject(selectedProject.id, editingTask.id, taskData);
    else addTaskToProject(selectedProject.id, taskData);
    updateProjectProgress(selectedProject.id);
    setIsTaskDialogOpen(false);
  };

  const deleteTask = (taskId: string) => {
    if (!selectedProject) return;
    deleteTaskFromProject(selectedProject.id, taskId);
    updateProjectProgress(selectedProject.id);
  };

  const updateProjectProgress = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    const doneTasks = project.tasks.filter((t) => t.status === 'done').length;
    const progress = project.tasks.length > 0 ? Math.round((doneTasks / project.tasks.length) * 100) : 0;
    updateProject(projectId, { progress });
  };

  // Milestone CRUD
  const openNewMilestoneDialog = () => {
    setEditingMilestone(null);
    setMilestoneForm({ title: '', description: '', dueDate: '' });
    setIsMilestoneDialogOpen(true);
  };

  const saveMilestone = () => {
    if (!selectedProject || !milestoneForm.title.trim()) return;
    const milestoneData: Milestone = {
      id: editingMilestone?.id || uuidv4(),
      title: milestoneForm.title.trim(), description: milestoneForm.description.trim() || undefined,
      dueDate: milestoneForm.dueDate || undefined, completed: editingMilestone?.completed || false,
      createdAt: editingMilestone?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    if (editingMilestone) updateMilestoneInProject(selectedProject.id, editingMilestone.id, milestoneData);
    else addMilestoneToProject(selectedProject.id, milestoneData);
    setIsMilestoneDialogOpen(false);
  };

  const toggleMilestone = (milestoneId: string, completed: boolean) => {
    if (!selectedProject) return;
    updateMilestoneInProject(selectedProject.id, milestoneId, { completed, completedAt: completed ? new Date().toISOString() : undefined });
  };

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert('El archivo es demasiado grande. El tamaño máximo es 5MB.');
      return;
    }

    setUploadingFile(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setDocumentForm(prev => ({
          ...prev,
          fileName: file.name,
          fileData: base64,
          fileSize: file.size,
          name: prev.name || file.name.replace(/\.[^/.]+$/, ''),
        }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error al subir el archivo');
    } finally {
      setUploadingFile(false);
    }
  };

  // Document CRUD
  const openNewDocumentDialog = () => {
    setEditingDocument(null);
    setDocumentForm({ name: '', type: 'informe', description: '', date: format(new Date(), 'yyyy-MM-dd'), version: '1.0', status: 'draft', fileName: '', fileData: '', fileSize: 0 });
    setIsDocumentDialogOpen(true);
  };

  const saveDocument = () => {
    if (!selectedProject || !documentForm.name.trim()) return;
    const docData: ProjectDocument = {
      id: editingDocument?.id || uuidv4(),
      name: documentForm.name.trim(), type: documentForm.type, description: documentForm.description.trim() || undefined,
      date: documentForm.date, version: documentForm.version, status: documentForm.status,
      fileName: documentForm.fileName || undefined,
      fileData: documentForm.fileData || undefined,
      fileSize: documentForm.fileSize || undefined,
      createdAt: editingDocument?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    if (editingDocument) updateDocumentInProject(selectedProject.id, editingDocument.id, docData);
    else addDocumentToProject(selectedProject.id, docData);
    setIsDocumentDialogOpen(false);
  };

  const openDocumentViewer = (doc: ProjectDocument) => {
    if (doc.fileData) {
      setViewingDocument(doc);
      setIsDocumentViewerOpen(true);
    }
  };

  const downloadDocument = (doc: ProjectDocument) => {
    if (doc.fileData) {
      const link = document.createElement('a');
      link.href = doc.fileData;
      link.download = doc.fileName || doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getFileType = (fileName: string): 'pdf' | 'word' | 'excel' | 'other' => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(ext || '')) return 'word';
    if (['xls', 'xlsx'].includes(ext || '')) return 'excel';
    return 'other';
  };

  // Meeting CRUD
  const openNewMeetingDialog = () => {
    setEditingMeeting(null);
    setMeetingForm({
      title: '', date: format(new Date(), 'yyyy-MM-dd'), time: '10:00', duration: 60,
      type: 'followup', agenda: '', attendees: '', notes: '', status: 'scheduled',
    });
    setIsMeetingDialogOpen(true);
  };

  const saveMeeting = () => {
    if (!selectedProject || !meetingForm.title.trim()) return;
    const meetingData: ProjectMeeting = {
      id: editingMeeting?.id || uuidv4(),
      title: meetingForm.title.trim(), date: meetingForm.date, time: meetingForm.time, duration: meetingForm.duration,
      type: meetingForm.type, agenda: meetingForm.agenda.split('\n').filter(a => a.trim()),
      attendees: meetingForm.attendees.split(',').map(a => a.trim()).filter(Boolean),
      notes: meetingForm.notes.trim() || undefined, status: meetingForm.status,
      actionItems: editingMeeting?.actionItems || [],
      createdAt: editingMeeting?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    if (editingMeeting) updateMeetingInProject(selectedProject.id, editingMeeting.id, meetingData);
    else addMeetingToProject(selectedProject.id, meetingData);
    setIsMeetingDialogOpen(false);
  };

  // Social Media Post CRUD
  const openNewPostDialog = () => {
    setEditingPost(null);
    setPostForm({ platform: 'instagram', content: '', hashtags: '', scheduledDate: '', scheduledTime: '', status: 'idea', notes: '' });
    setIsPostDialogOpen(true);
  };

  const savePost = () => {
    if (!postForm.content.trim()) return;
    const postData: SocialMediaPost = {
      id: editingPost?.id || uuidv4(),
      platform: postForm.platform, content: postForm.content.trim(),
      hashtags: postForm.hashtags.split(' ').filter(h => h.trim()),
      scheduledDate: postForm.scheduledDate || undefined, scheduledTime: postForm.scheduledTime || undefined,
      status: postForm.status, notes: postForm.notes.trim() || undefined,
      createdAt: editingPost?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    if (editingPost) updateSocialMediaPost(editingPost.id, postData);
    else addSocialMediaPost(postData);
    setIsPostDialogOpen(false);
  };

  // Commercial Lead CRUD
  const openNewLeadDialog = () => {
    setEditingLead(null);
    setLeadForm({ name: '', company: '', email: '', phone: '', source: '', status: 'new', value: '', probability: '50', notes: '', nextFollowUp: '' });
    setIsLeadDialogOpen(true);
  };

  const saveLead = () => {
    if (!leadForm.name.trim()) return;
    const leadData: CommercialLead = {
      id: editingLead?.id || uuidv4(),
      name: leadForm.name.trim(), company: leadForm.company.trim() || undefined,
      email: leadForm.email.trim() || undefined, phone: leadForm.phone.trim() || undefined,
      source: leadForm.source.trim(), status: leadForm.status, value: leadForm.value ? parseFloat(leadForm.value) : undefined,
      probability: leadForm.probability ? parseInt(leadForm.probability) : undefined,
      notes: leadForm.notes.trim() || undefined, nextFollowUp: leadForm.nextFollowUp || undefined,
      createdAt: editingLead?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    if (editingLead) updateCommercialLead(editingLead.id, leadData);
    else addCommercialLead(leadData);
    setIsLeadDialogOpen(false);
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveLeadId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLeadId(null);

    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as CommercialLead['status'];

    if (leadStatusConfig[newStatus as keyof typeof leadStatusConfig]) {
      updateCommercialLead(leadId, { status: newStatus });
    }
  };

  // Calendar events
  const calendarEvents = useMemo(() => {
    const events: { date: string; type: string; title: string; color: string; projectId?: string }[] = [];
    
    projects.forEach(project => {
      if (project.deadline) {
        events.push({ date: project.deadline, type: 'deadline', title: `Deadline: ${project.name}`, color: project.color, projectId: project.id });
      }
      (project.meetings || []).forEach(meeting => {
        if (meeting.date) {
          events.push({ date: meeting.date, type: 'meeting', title: meeting.title, color: '#8b5cf6', projectId: project.id });
        }
      });
    });

    commercialLeads.forEach(lead => {
      if (lead.nextFollowUp) {
        events.push({ date: lead.nextFollowUp, type: 'followup', title: `Seguimiento: ${lead.name}`, color: '#f59e0b' });
      }
    });

    socialMediaPosts.forEach(post => {
      if (post.scheduledDate && post.status === 'scheduled') {
        events.push({ date: post.scheduledDate, type: 'post', title: `Post: ${platformConfig[post.platform].label}`, color: '#3b82f6' });
      }
    });

    return events;
  }, [projects, commercialLeads, socialMediaPosts]);

  // Render document viewer
  const renderDocumentViewer = () => {
    if (!viewingDocument) return null;

    const fileType = viewingDocument.fileName ? getFileType(viewingDocument.fileName) : 'other';
    
    // Create blob URL for preview
    const getBlobUrl = (fileData: string, fileName: string): string => {
      // Extract mime type from base64 data URL
      const mimeMatch = fileData.match(/^data:([^;]+);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      
      // Convert base64 to blob
      const base64Data = fileData.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      return URL.createObjectURL(blob);
    };

    return (
      <Dialog open={isDocumentViewerOpen} onOpenChange={setIsDocumentViewerOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] p-0">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {viewingDocument.name}
              </DialogTitle>
              <div className="flex items-center gap-2">
                {viewingDocument.fileName && (
                  <Badge variant="outline">{viewingDocument.fileName}</Badge>
                )}
                {viewingDocument.fileSize && (
                  <span className="text-xs text-muted-foreground">
                    {(viewingDocument.fileSize / 1024).toFixed(1)} KB
                  </span>
                )}
                <Button variant="outline" size="sm" onClick={() => downloadDocument(viewingDocument)}>
                  <Download className="h-4 w-4 mr-1" />
                  Descargar
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="h-[80vh] overflow-auto">
            {fileType === 'pdf' && viewingDocument.fileData && (
              <iframe
                src={viewingDocument.fileData}
                className="w-full h-full border-0"
                title={viewingDocument.name}
              />
            )}
            {fileType === 'word' && viewingDocument.fileData && (
              <div className="h-full flex flex-col">
                <div className="bg-muted p-2 flex items-center justify-between border-b">
                  <span className="text-sm text-muted-foreground">
                    Vista previa de documento Word
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const blobUrl = getBlobUrl(viewingDocument.fileData!, viewingDocument.fileName || 'document.docx');
                      window.open(blobUrl, '_blank');
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Abrir en nueva pestaña
                  </Button>
                </div>
                <iframe
                  src={getBlobUrl(viewingDocument.fileData, viewingDocument.fileName || 'document.docx')}
                  className="flex-1 w-full border-0"
                  title={viewingDocument.name}
                />
              </div>
            )}
            {fileType === 'excel' && viewingDocument.fileData && (
              <div className="h-full flex flex-col">
                <div className="bg-muted p-2 flex items-center justify-between border-b">
                  <span className="text-sm text-muted-foreground">
                    Vista previa de planilla Excel
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const blobUrl = getBlobUrl(viewingDocument.fileData!, viewingDocument.fileName || 'spreadsheet.xlsx');
                      window.open(blobUrl, '_blank');
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Abrir en nueva pestaña
                  </Button>
                </div>
                <iframe
                  src={getBlobUrl(viewingDocument.fileData, viewingDocument.fileName || 'spreadsheet.xlsx')}
                  className="flex-1 w-full border-0"
                  title={viewingDocument.name}
                />
              </div>
            )}
            {fileType === 'other' && (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <File className="h-20 w-20 text-gray-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Archivo</h3>
                <p className="text-muted-foreground mb-4">
                  Vista previa no disponible para este tipo de archivo.
                </p>
                <Button onClick={() => downloadDocument(viewingDocument)}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar {viewingDocument.fileName}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Render calendar
  const renderCalendar = () => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendario Unificado
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setCalendarMonth(subDays(calendarMonth, 30))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium min-w-[140px] text-center">
                {format(calendarMonth, 'MMMM yyyy', { locale: es })}
              </span>
              <Button variant="outline" size="icon" onClick={() => setCalendarMonth(addDays(calendarMonth, 30))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">{day}</div>
            ))}
            {days.map((day) => {
              const dayEvents = calendarEvents.filter(e => isSameDay(parseISO(e.date), day));
              const isCurrentDay = isToday(day);
              return (
                <div key={day.toISOString()} className={cn('min-h-24 p-1 border rounded', isCurrentDay && 'bg-primary/10 border-primary')}>
                  <div className={cn('text-sm mb-1 font-medium', isCurrentDay && 'text-primary')}>{format(day, 'd')}</div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event, i) => (
                      <div key={i} className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80" style={{ backgroundColor: event.color, color: 'white' }} title={event.title}>
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-foreground">+{dayEvents.length - 3} más</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-purple-500" /><span className="text-sm">Reuniones</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-500" /><span className="text-sm">Deadlines</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-orange-500" /><span className="text-sm">Seguimientos</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-500" /><span className="text-sm">Posts</span></div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render alerts
  const renderAlerts = () => {
    if (activeAlerts.length === 0) return null;

    return (
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-orange-700 dark:text-orange-400">
            <BellRing className="h-5 w-5" />
            Alertas y Recordatorios ({activeAlerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {activeAlerts.slice(0, 6).map((alert) => (
              <div key={alert.id} className="flex items-start gap-2 p-2 rounded bg-white dark:bg-gray-800 border">
                <div className={cn('w-2 h-2 rounded-full mt-1.5', alert.color)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{alert.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{alert.description}</p>
                  <p className="text-xs text-muted-foreground">{format(parseISO(alert.date), 'd MMM', { locale: es })}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => dismissProjectAlert(alert.id)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render project cards
  const renderProjectCards = (projectList: Project[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projectList.map((project) => (
        <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openProjectDetail(project)}>
          <div className="h-2" style={{ backgroundColor: project.color }} />
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                {project.name}
                <Badge variant="outline" className={priorityConfig[project.priority].color}>{priorityConfig[project.priority].label}</Badge>
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditProjectDialog(project); }}><Edit className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Eliminar</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.type === 'client' && project.client && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building className="h-4 w-4" />
                <span>{project.client.company || project.client.name}</span>
              </div>
            )}
            {project.description && <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>}
            <div className="flex items-center justify-between">
              <Badge className={`${statusConfig[project.status].color} text-white`}>{statusConfig[project.status].label}</Badge>
              <span className="text-sm font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><FileText className="h-4 w-4" />{(project.documents || []).length}</span>
              <span className="flex items-center gap-1"><Video className="h-4 w-4" />{(project.meetings || []).length}</span>
              <span className="flex items-center gap-1"><ListTodo className="h-4 w-4" />{project.tasks.length}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Render project detail
  const renderProjectDetail = () => {
    if (!selectedProject) return null;
    const project = projects.find((p) => p.id === selectedProject.id) || selectedProject;

    return (
      <Dialog open={isProjectDetailOpen} onOpenChange={setIsProjectDetailOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: project.color }} />
              <DialogTitle className="text-xl">{project.name}</DialogTitle>
              <Badge className={`${statusConfig[project.status].color} text-white`}>{statusConfig[project.status].label}</Badge>
            </div>
            <DialogDescription>{project.description}</DialogDescription>
          </DialogHeader>

          {project.type === 'client' && project.client && (
            <Card className="mt-4">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><p className="text-sm text-muted-foreground">Cliente</p><p className="font-medium">{project.client.name}</p></div>
                  {project.client.company && <div><p className="text-sm text-muted-foreground">Empresa</p><p className="font-medium">{project.client.company}</p></div>}
                  {project.client.email && <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{project.client.email}</p></div>}
                  {project.client.phone && <div><p className="text-sm text-muted-foreground">Teléfono</p><p className="font-medium">{project.client.phone}</p></div>}
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs value={detailTab} onValueChange={setDetailTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="documents">Documentos</TabsTrigger>
              <TabsTrigger value="meetings">Reuniones</TabsTrigger>
              <TabsTrigger value="tasks">Tareas</TabsTrigger>
              <TabsTrigger value="milestones">Hitos</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 rounded-lg"><ListTodo className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{project.tasks.length}</p><p className="text-sm text-muted-foreground">Tareas</p></div></div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-green-100 rounded-lg"><FileText className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-bold">{(project.documents || []).length}</p><p className="text-sm text-muted-foreground">Documentos</p></div></div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-purple-100 rounded-lg"><Video className="h-5 w-5 text-purple-600" /></div><div><p className="text-2xl font-bold">{(project.meetings || []).length}</p><p className="text-sm text-muted-foreground">Reuniones</p></div></div></CardContent></Card>
              </div>
              <div className="flex items-center gap-4">
                <Progress value={project.progress} className="flex-1 h-3" />
                <span className="font-semibold">{project.progress}%</span>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Documentos</h4>
                <Button size="sm" onClick={openNewDocumentDialog}><Plus className="h-4 w-4 mr-1" />Agregar</Button>
              </div>
              {(project.documents || []).length > 0 ? (
                <div className="space-y-2">
                  {project.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 cursor-pointer" onClick={() => doc.fileData && openDocumentViewer(doc)}>
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">{doc.name}</p>
                        <div className="flex gap-2 text-sm text-muted-foreground">
                          <span>{doc.type}</span>
                          <span>•</span>
                          <span>{format(parseISO(doc.date), 'd MMM yyyy', { locale: es })}</span>
                          {doc.fileName && <><span>•</span><span>{doc.fileName}</span></>}
                        </div>
                      </div>
                      <Badge className={doc.status === 'final' ? 'bg-green-100 text-green-700' : doc.status === 'review' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}>
                        {doc.status === 'final' ? 'Final' : doc.status === 'review' ? 'Revisión' : 'Borrador'}
                      </Badge>
                      {doc.fileData && (
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDocumentViewer(doc); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" onClick={() => { setEditingDocument(doc); setDocumentForm({ name: doc.name, type: doc.type, description: doc.description || '', date: doc.date, version: doc.version || '1.0', status: doc.status, fileName: doc.fileName || '', fileData: doc.fileData || '', fileSize: doc.fileSize || 0 }); setIsDocumentDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteDocumentFromProject(project.id, doc.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No hay documentos</p>
              )}
            </TabsContent>

            <TabsContent value="meetings" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Reuniones</h4>
                <Button size="sm" onClick={openNewMeetingDialog}><Plus className="h-4 w-4 mr-1" />Agregar</Button>
              </div>
              {(project.meetings || []).length > 0 ? (
                <div className="space-y-2">
                  {project.meetings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((meeting) => (
                    <div key={meeting.id} className="p-4 bg-muted rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{meeting.title}</p>
                            <Badge className={meetingTypeConfig[meeting.type].color}>{meetingTypeConfig[meeting.type].label}</Badge>
                          </div>
                          <div className="flex gap-2 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(parseISO(meeting.date), 'd MMM yyyy', { locale: es })}</span>
                            {meeting.time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{meeting.time}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={meeting.status === 'completed' ? 'bg-green-100 text-green-700' : meeting.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}>
                            {meeting.status === 'completed' ? 'Completada' : meeting.status === 'cancelled' ? 'Cancelada' : 'Programada'}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => { setEditingMeeting(meeting); setMeetingForm({ title: meeting.title, date: meeting.date, time: meeting.time || '10:00', duration: meeting.duration || 60, type: meeting.type, agenda: meeting.agenda.join('\n'), attendees: meeting.attendees.join(', '), notes: meeting.notes || '', status: meeting.status }); setIsMeetingDialogOpen(true); }}><Edit className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deleteMeetingFromProject(project.id, meeting.id)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Eliminar</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No hay reuniones</p>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Tareas</h4>
                <Button size="sm" onClick={openNewTaskDialog}><Plus className="h-4 w-4 mr-1" />Agregar</Button>
              </div>
              {project.tasks.length > 0 ? (
                <div className="space-y-2">
                  {project.tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Select value={task.status} onValueChange={(v) => { updateTaskInProject(project.id, task.id, { status: v as TaskStatus }); updateProjectProgress(project.id); }}>
                        <SelectTrigger className="w-32"><Badge className={taskStatusConfig[task.status].color}>{taskStatusConfig[task.status].label}</Badge></SelectTrigger>
                        <SelectContent>{Object.entries(taskStatusConfig).map(([key, val]) => (<SelectItem key={key} value={key}>{val.label}</SelectItem>))}</SelectContent></Select>
                      <div className="flex-1">
                        <p className={cn(task.status === 'done' && 'line-through text-muted-foreground')}>{task.title}</p>
                        {task.dueDate && <p className="text-sm text-muted-foreground">Vence: {format(parseISO(task.dueDate), 'd MMM yyyy', { locale: es })}</p>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingTask(task); setTaskForm({ title: task.title, description: task.description || '', status: task.status, priority: task.priority, dueDate: task.dueDate || '' }); setIsTaskDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No hay tareas</p>
              )}
            </TabsContent>

            <TabsContent value="milestones" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Hitos</h4>
                <Button size="sm" onClick={openNewMilestoneDialog}><Plus className="h-4 w-4 mr-1" />Agregar</Button>
              </div>
              {project.milestones && project.milestones.length > 0 ? (
                <div className="space-y-2">
                  {project.milestones.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <button onClick={() => toggleMilestone(m.id, !m.completed)}>
                        {m.completed ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />}
                      </button>
                      <div className="flex-1">
                        <p className={cn('font-medium', m.completed && 'line-through text-muted-foreground')}>{m.title}</p>
                        {m.dueDate && <p className="text-sm text-muted-foreground">{format(parseISO(m.dueDate), 'd MMM yyyy', { locale: es })}</p>}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => { setEditingMilestone(m); setMilestoneForm({ title: m.title, description: m.description || '', dueDate: m.dueDate || '' }); setIsMilestoneDialogOpen(true); }}><Edit className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteMilestoneFromProject(project.id, m.id)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No hay hitos</p>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    );
  };

  // Render social media
  const renderSocialMedia = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2"><Instagram className="h-5 w-5" />Redes Sociales</h3>
        <Button size="sm" onClick={openNewPostDialog}><Plus className="h-4 w-4 mr-1" />Nuevo Post</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['instagram', 'linkedin', 'twitter', 'facebook'] as const).map((platform) => {
          const config = platformConfig[platform];
          const count = socialMediaPosts.filter(p => p.platform === platform).length;
          const Icon = config.icon;
          return (
            <Card key={platform}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Icon className={cn('h-6 w-6', config.color)} />
                  <div><p className="text-xl font-bold">{count}</p><p className="text-sm text-muted-foreground">{config.label}</p></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {socialMediaPosts.slice(0, 6).map((post) => {
          const config = platformConfig[post.platform];
          const Icon = config.icon;
          return (
            <Card key={post.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-5 w-5', config.color)} />
                    <Badge className={postStatusConfig[post.status].color}>{postStatusConfig[post.status].label}</Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => { setEditingPost(post); setPostForm({ platform: post.platform, content: post.content, hashtags: post.hashtags?.join(' ') || '', scheduledDate: post.scheduledDate || '', scheduledTime: post.scheduledTime || '', status: post.status, notes: post.notes || '' }); setIsPostDialogOpen(true); }}><Edit className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteSocialMediaPost(post.id)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Eliminar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-sm line-clamp-3">{post.content}</p>
                {post.scheduledDate && <p className="text-xs text-muted-foreground mt-2">{format(parseISO(post.scheduledDate), 'd MMM yyyy', { locale: es })}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  // Handler for editing lead
  const handleEditLead = (lead: CommercialLead) => {
    setEditingLead(lead);
    setLeadForm({
      name: lead.name,
      company: lead.company || '',
      email: lead.email || '',
      phone: lead.phone || '',
      source: lead.source,
      status: lead.status,
      value: lead.value?.toString() || '',
      probability: lead.probability?.toString() || '50',
      notes: lead.notes || '',
      nextFollowUp: lead.nextFollowUp || '',
    });
    setIsLeadDialogOpen(true);
  };

  // Render commercial pipeline with drag and drop
  const renderCommercialPipeline = () => {
    const stages = Object.keys(leadStatusConfig) as CommercialLead['status'][];
    const activeLead = activeLeadId ? commercialLeads.find(l => l.id === activeLeadId) : null;

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center gap-2"><TrendingUp className="h-5 w-5" />Pipeline Comercial</h3>
            <Button size="sm" onClick={openNewLeadDialog}><Plus className="h-4 w-4 mr-1" />Nuevo Lead</Button>
          </div>

          {/* Monthly Goals */}
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Objetivos Mensuales - {format(new Date(), 'MMMM yyyy', { locale: es })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Objetivo Leads</Label>
                    <Input
                      type="number"
                      value={monthlyLeadGoal}
                      onChange={(e) => setMonthlyLeadGoal(parseInt(e.target.value) || 0)}
                      className="w-20 h-7 text-sm"
                    />
                  </div>
                  <Progress value={monthlyStats.leadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground">{monthlyStats.totalLeads} de {monthlyLeadGoal} leads</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Objetivo Facturación</Label>
                    <div className="flex items-center gap-1">
                      <span className="text-sm">$</span>
                      <Input
                        type="number"
                        value={monthlyBillingGoal}
                        onChange={(e) => setMonthlyBillingGoal(parseInt(e.target.value) || 0)}
                        className="w-24 h-7 text-sm"
                      />
                    </div>
                  </div>
                  <Progress value={monthlyStats.billingProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground">${monthlyStats.wonValue.toLocaleString()} de ${monthlyBillingGoal.toLocaleString()}</p>
                </div>
                <Card className="bg-blue-50 dark:bg-blue-950/20">
                  <CardContent className="p-3">
                    <p className="text-2xl font-bold text-blue-600">{monthlyStats.totalLeads}</p>
                    <p className="text-xs text-muted-foreground">Leads este mes</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 dark:bg-green-950/20">
                  <CardContent className="p-3">
                    <p className="text-2xl font-bold text-green-600">${monthlyStats.wonValue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Facturado este mes</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 rounded-lg"><Users className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{commercialLeads.length}</p><p className="text-sm text-muted-foreground">Total Leads</p></div></div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-green-100 rounded-lg"><DollarSign className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-bold">${commercialLeads.reduce((s, l) => s + (l.value || 0), 0).toLocaleString()}</p><p className="text-sm text-muted-foreground">Valor Total</p></div></div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-purple-100 rounded-lg"><Target className="h-5 w-5 text-purple-600" /></div><div><p className="text-2xl font-bold">{commercialLeads.filter(l => l.status === 'won').length}</p><p className="text-sm text-muted-foreground">Ganados</p></div></div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-orange-100 rounded-lg"><TrendingUp className="h-5 w-5 text-orange-600" /></div><div><p className="text-2xl font-bold">{monthlyStats.contactedCount}</p><p className="text-sm text-muted-foreground">Contactados</p></div></div></CardContent></Card>
          </div>

          {/* Pipeline Board - Horizontal Scroll */}
          <div className="w-full">
            <div className="pipeline-scroll-container">
              <div className="flex gap-4" style={{ width: 'calc(288px * 7 + 24px * 6)', minWidth: '100%' }}>
                {stages.map((stage) => {
                  const stageLeads = commercialLeads.filter(l => l.status === stage);
                  const config = leadStatusConfig[stage];
                  const stageValue = stageLeads.reduce((sum, l) => sum + (l.value || 0), 0);
                  
                  return (
                    <DroppableColumn
                      key={stage}
                      stage={stage}
                      config={config}
                      stageLeads={stageLeads}
                      stageValue={stageValue}
                      onEditLead={handleEditLead}
                      onDeleteLead={deleteCommercialLead}
                    />
                  );
                })}
              </div>
            </div>
            
            {/* Scroll hint */}
            <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground bg-muted/30 rounded">
              <ChevronLeft className="h-4 w-4" />
              <span>← Desliza horizontalmente para ver todas las etapas →</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeLead ? (
              <Card className="shadow-lg ring-2 ring-primary">
                <CardContent className="p-3">
                  <p className="font-medium">{activeLead.name}</p>
                  {activeLead.company && <p className="text-sm text-muted-foreground">{activeLead.company}</p>}
                  {activeLead.value && <p className="text-sm font-semibold text-green-600">${activeLead.value.toLocaleString()}</p>}
                </CardContent>
              </Card>
            ) : null}
          </DragOverlay>
        </div>
      </DndContext>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><FolderKanban className="h-8 w-8 text-primary" />Proyectos</h1>
          <p className="text-muted-foreground">Gestiona tus proyectos de consultoría y tu negocio</p>
        </div>
      </div>

      {/* Alerts */}
      {renderAlerts()}

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTab)}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="clients"><Building className="h-4 w-4 mr-2" />Clientes</TabsTrigger>
          <TabsTrigger value="business"><TrendingUp className="h-4 w-4 mr-2" />Mi Negocio</TabsTrigger>
          <TabsTrigger value="calendar"><Calendar className="h-4 w-4 mr-2" />Calendario</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar proyectos o clientes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as ProjectStatus | 'all')}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Filtrar estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(statusConfig).map(([key, val]) => (<SelectItem key={key} value={key}>{val.label}</SelectItem>))}
              </SelectContent>
            </Select>
            <Button onClick={() => openNewProjectDialog('client')}><Plus className="h-4 w-4 mr-2" />Nuevo Proyecto</Button>
          </div>
          {filteredProjects.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Building className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No hay proyectos de clientes</h3>
                <Button onClick={() => openNewProjectDialog('client')}><Plus className="h-4 w-4 mr-2" />Crear Proyecto</Button>
              </CardContent>
            </Card>
          ) : renderProjectCards(filteredProjects)}
        </TabsContent>

        <TabsContent value="business" className="space-y-6 mt-4">
          <Tabs defaultValue="commercial">
            <TabsList>
              <TabsTrigger value="commercial"><TrendingUp className="h-4 w-4 mr-2" />Comercial</TabsTrigger>
              <TabsTrigger value="social"><Instagram className="h-4 w-4 mr-2" />Redes Sociales</TabsTrigger>
              <TabsTrigger value="internal"><FolderKanban className="h-4 w-4 mr-2" />Proyectos Internos</TabsTrigger>
            </TabsList>
            <TabsContent value="commercial" className="mt-4">{renderCommercialPipeline()}</TabsContent>
            <TabsContent value="social" className="mt-4">{renderSocialMedia()}</TabsContent>
            <TabsContent value="internal" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Proyectos Internos</h3>
                <Button size="sm" onClick={() => openNewProjectDialog('internal')}><Plus className="h-4 w-4 mr-1" />Nuevo</Button>
              </div>
              {internalProjects.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <FolderKanban className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No hay proyectos internos</h3>
                    <Button onClick={() => openNewProjectDialog('internal')}><Plus className="h-4 w-4 mr-2" />Crear Proyecto</Button>
                  </CardContent>
                </Card>
              ) : renderProjectCards(internalProjects)}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          {renderCalendar()}
        </TabsContent>
      </Tabs>

      {/* All Dialogs */}
      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Label>Nombre *</Label><Input value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} /></div>
              <div className="col-span-2"><Label>Descripción</Label><Textarea value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} rows={2} /></div>
            </div>
            {projectForm.type === 'client' && (
              <div className="border-t pt-4 space-y-4">
                <h4 className="font-semibold flex items-center gap-2"><Users className="h-4 w-4" />Información del Cliente</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Nombre del cliente</Label><Input value={projectForm.clientName} onChange={(e) => setProjectForm({ ...projectForm, clientName: e.target.value })} /></div>
                  <div><Label>Empresa</Label><Input value={projectForm.clientCompany} onChange={(e) => setProjectForm({ ...projectForm, clientCompany: e.target.value })} /></div>
                  <div><Label>Email</Label><Input type="email" value={projectForm.clientEmail} onChange={(e) => setProjectForm({ ...projectForm, clientEmail: e.target.value })} /></div>
                  <div><Label>Teléfono</Label><Input value={projectForm.clientPhone} onChange={(e) => setProjectForm({ ...projectForm, clientPhone: e.target.value })} /></div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Estado</Label><Select value={projectForm.status} onValueChange={(v) => setProjectForm({ ...projectForm, status: v as ProjectStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(statusConfig).map(([key, val]) => (<SelectItem key={key} value={key}>{val.label}</SelectItem>))}</SelectContent></Select></div>
              <div><Label>Prioridad</Label><Select value={projectForm.priority} onValueChange={(v) => setProjectForm({ ...projectForm, priority: v as ProjectPriority })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(priorityConfig).map(([key, val]) => (<SelectItem key={key} value={key}>{val.label}</SelectItem>))}</SelectContent></Select></div>
              <div><Label>Fecha inicio</Label><Input type="date" value={projectForm.startDate} onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })} /></div>
              <div><Label>Fecha límite</Label><Input type="date" value={projectForm.deadline} onChange={(e) => setProjectForm({ ...projectForm, deadline: e.target.value })} /></div>
            </div>
            <div><Label>Color</Label><div className="flex gap-2 flex-wrap">{projectColors.map((color) => (<button key={color} type="button" className={cn('w-8 h-8 rounded-full border-2', projectForm.color === color ? 'border-foreground scale-110' : 'border-transparent')} style={{ backgroundColor: color }} onClick={() => setProjectForm({ ...projectForm, color })} />))}</div></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProjectDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveProject} disabled={!projectForm.name.trim()}>{editingProject ? 'Guardar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingTask ? 'Editar Tarea' : 'Nueva Tarea'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título *</Label><Input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} /></div>
            <div><Label>Descripción</Label><Textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Estado</Label><Select value={taskForm.status} onValueChange={(v) => setTaskForm({ ...taskForm, status: v as TaskStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(taskStatusConfig).map(([key, val]) => (<SelectItem key={key} value={key}>{val.label}</SelectItem>))}</SelectContent></Select></div>
              <div><Label>Prioridad</Label><Select value={taskForm.priority} onValueChange={(v) => setTaskForm({ ...taskForm, priority: v as 'low' | 'medium' | 'high' })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Baja</SelectItem><SelectItem value="medium">Media</SelectItem><SelectItem value="high">Alta</SelectItem></SelectContent></Select></div>
            </div>
            <div><Label>Fecha de vencimiento</Label><Input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>Cancelar</Button>
            {editingTask && <Button variant="destructive" onClick={() => { deleteTask(editingTask.id); setIsTaskDialogOpen(false); }}>Eliminar</Button>}
            <Button onClick={saveTask} disabled={!taskForm.title.trim()}>{editingTask ? 'Guardar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isMilestoneDialogOpen} onOpenChange={setIsMilestoneDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingMilestone ? 'Editar Hito' : 'Nuevo Hito'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título *</Label><Input value={milestoneForm.title} onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })} /></div>
            <div><Label>Descripción</Label><Textarea value={milestoneForm.description} onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })} rows={2} /></div>
            <div><Label>Fecha objetivo</Label><Input type="date" value={milestoneForm.dueDate} onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMilestoneDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveMilestone} disabled={!milestoneForm.title.trim()}>{editingMilestone ? 'Guardar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingDocument ? 'Editar Documento' : 'Nuevo Documento'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nombre *</Label><Input value={documentForm.name} onChange={(e) => setDocumentForm({ ...documentForm, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Tipo</Label><Select value={documentForm.type} onValueChange={(v) => setDocumentForm({ ...documentForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="informe">Informe</SelectItem>
                  <SelectItem value="presentacion">Presentación</SelectItem>
                  <SelectItem value="contrato">Contrato</SelectItem>
                  <SelectItem value="spreadsheet">Planilla</SelectItem>
                  <SelectItem value="propuesta">Propuesta</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select></div>
              <div><Label>Estado</Label><Select value={documentForm.status} onValueChange={(v) => setDocumentForm({ ...documentForm, status: v as 'draft' | 'review' | 'final' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="review">Revisión</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                </SelectContent>
              </Select></div>
            </div>
            <div><Label>Descripción</Label><Textarea value={documentForm.description} onChange={(e) => setDocumentForm({ ...documentForm, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Fecha</Label><Input type="date" value={documentForm.date} onChange={(e) => setDocumentForm({ ...documentForm, date: e.target.value })} /></div>
              <div><Label>Versión</Label><Input value={documentForm.version} onChange={(e) => setDocumentForm({ ...documentForm, version: e.target.value })} /></div>
            </div>
            <div>
              <Label>Archivo (PDF, Word, Excel - máx 5MB)</Label>
              <input type="file" ref={fileInputRef} accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={handleFileUpload} className="hidden" />
              <div className="mt-2 flex items-center gap-2">
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile}>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingFile ? 'Subiendo...' : 'Subir Archivo'}
                </Button>
                {documentForm.fileName && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4" />
                    <span>{documentForm.fileName}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDocumentForm({ ...documentForm, fileName: '', fileData: '', fileSize: 0 })}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDocumentDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveDocument} disabled={!documentForm.name.trim()}>{editingDocument ? 'Guardar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isMeetingDialogOpen} onOpenChange={setIsMeetingDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingMeeting ? 'Editar Reunión' : 'Nueva Reunión'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título *</Label><Input value={meetingForm.title} onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Fecha</Label><Input type="date" value={meetingForm.date} onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })} /></div>
              <div><Label>Hora</Label><Input type="time" value={meetingForm.time} onChange={(e) => setMeetingForm({ ...meetingForm, time: e.target.value })} /></div>
              <div><Label>Duración (min)</Label><Input type="number" value={meetingForm.duration} onChange={(e) => setMeetingForm({ ...meetingForm, duration: parseInt(e.target.value) || 60 })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Tipo</Label><Select value={meetingForm.type} onValueChange={(v) => setMeetingForm({ ...meetingForm, type: v as typeof meetingForm.type })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kickoff">Kickoff</SelectItem>
                  <SelectItem value="followup">Seguimiento</SelectItem>
                  <SelectItem value="review">Revisión</SelectItem>
                  <SelectItem value="delivery">Entrega</SelectItem>
                  <SelectItem value="other">Otra</SelectItem>
                </SelectContent>
              </Select></div>
              <div><Label>Estado</Label><Select value={meetingForm.status} onValueChange={(v) => setMeetingForm({ ...meetingForm, status: v as typeof meetingForm.status })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Programada</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select></div>
            </div>
            <div><Label>Agenda (un item por línea)</Label><Textarea value={meetingForm.agenda} onChange={(e) => setMeetingForm({ ...meetingForm, agenda: e.target.value })} rows={3} /></div>
            <div><Label>Asistentes (separados por coma)</Label><Input value={meetingForm.attendees} onChange={(e) => setMeetingForm({ ...meetingForm, attendees: e.target.value })} /></div>
            <div><Label>Notas</Label><Textarea value={meetingForm.notes} onChange={(e) => setMeetingForm({ ...meetingForm, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMeetingDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveMeeting} disabled={!meetingForm.title.trim()}>{editingMeeting ? 'Guardar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingPost ? 'Editar Post' : 'Nuevo Post'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Plataforma</Label><Select value={postForm.platform} onValueChange={(v) => setPostForm({ ...postForm, platform: v as SocialMediaPost['platform'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(platformConfig).map(([key, val]) => (<SelectItem key={key} value={key}>{val.label}</SelectItem>))}</SelectContent>
              </Select></div>
              <div><Label>Estado</Label><Select value={postForm.status} onValueChange={(v) => setPostForm({ ...postForm, status: v as SocialMediaPost['status'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(postStatusConfig).map(([key, val]) => (<SelectItem key={key} value={key}>{val.label}</SelectItem>))}</SelectContent>
              </Select></div>
            </div>
            <div><Label>Contenido *</Label><Textarea value={postForm.content} onChange={(e) => setPostForm({ ...postForm, content: e.target.value })} rows={4} /></div>
            <div><Label>Hashtags (separados por espacio)</Label><Input value={postForm.hashtags} onChange={(e) => setPostForm({ ...postForm, hashtags: e.target.value })} placeholder="#ejemplo #hashtag" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Fecha programada</Label><Input type="date" value={postForm.scheduledDate} onChange={(e) => setPostForm({ ...postForm, scheduledDate: e.target.value })} /></div>
              <div><Label>Hora programada</Label><Input type="time" value={postForm.scheduledTime} onChange={(e) => setPostForm({ ...postForm, scheduledTime: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPostDialogOpen(false)}>Cancelar</Button>
            <Button onClick={savePost} disabled={!postForm.content.trim()}>{editingPost ? 'Guardar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isLeadDialogOpen} onOpenChange={setIsLeadDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingLead ? 'Editar Lead' : 'Nuevo Lead'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nombre *</Label><Input value={leadForm.name} onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })} /></div>
              <div><Label>Empresa</Label><Input value={leadForm.company} onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Email</Label><Input type="email" value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} /></div>
              <div><Label>Teléfono</Label><Input value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Origen</Label><Input value={leadForm.source} onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })} placeholder="LinkedIn, Referido..." /></div>
              <div><Label>Estado</Label><Select value={leadForm.status} onValueChange={(v) => setLeadForm({ ...leadForm, status: v as CommercialLead['status'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(leadStatusConfig).map(([key, val]) => (<SelectItem key={key} value={key}>{val.label}</SelectItem>))}</SelectContent>
              </Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Valor ($)</Label><Input type="number" value={leadForm.value} onChange={(e) => setLeadForm({ ...leadForm, value: e.target.value })} /></div>
              <div><Label>Probabilidad (%)</Label><Input type="number" min="0" max="100" value={leadForm.probability} onChange={(e) => setLeadForm({ ...leadForm, probability: e.target.value })} /></div>
            </div>
            <div><Label>Próximo seguimiento</Label><Input type="date" value={leadForm.nextFollowUp} onChange={(e) => setLeadForm({ ...leadForm, nextFollowUp: e.target.value })} /></div>
            <div><Label>Notas</Label><Textarea value={leadForm.notes} onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLeadDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveLead} disabled={!leadForm.name.trim()}>{editingLead ? 'Guardar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {renderProjectDetail()}
      {renderDocumentViewer()}
    </div>
  );
}
