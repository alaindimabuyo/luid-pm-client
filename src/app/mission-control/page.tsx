"use client";

import React, { useState } from "react";
import { useGetTasksQuery, useGetProjectsQuery, useGetUsersQuery } from "@/state/api";
import Header from "@/components/Header";
import { Task } from "@/state/api";
import { format } from "date-fns";
import { MessageSquareMore, Clock, User, AlertCircle, CheckCircle2, Circle, RefreshCw } from "lucide-react";
import Modal from "@/components/Modal";

type TaskStatus = "To Do" | "Work In Progress" | "Under Review" | "Completed";

const taskStatus: TaskStatus[] = ["To Do", "Work In Progress", "Under Review", "Completed"];

const statusConfig: Record<TaskStatus, { color: string; icon: React.ReactNode }> = {
  "To Do": { color: "#2563EB", icon: <Circle className="h-4 w-4" /> },
  "Work In Progress": { color: "#059669", icon: <RefreshCw className="h-4 w-4" /> },
  "Under Review": { color: "#D97706", icon: <Clock className="h-4 w-4" /> },
  "Completed": { color: "#10B981", icon: <CheckCircle2 className="h-4 w-4" /> },
};

const MissionControlPage = () => {
  const { data: tasks, isLoading: tasksLoading } = useGetTasksQuery({ projectId: 1 });
  const { data: projects, isLoading: projectsLoading } = useGetProjectsQuery();
  const { data: users } = useGetUsersQuery();
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  if (tasksLoading || projectsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-300">Loading Mission Control...</div>
      </div>
    );
  }

  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter((t) => t.status === "Completed").length || 0;
  const inProgressTasks = tasks?.filter((t) => t.status === "Work In Progress").length || 0;
  const pendingReviewTasks = tasks?.filter((t) => t.status === "Under Review").length || 0;

  return (
    <div className="container h-full w-full bg-gray-100 bg-transparent p-4 md:p-8">
      <Header name="Mission Control" />
      
      {/* Stats Overview */}
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 md:gap-4">
        <StatCard 
          title="Total Tasks" 
          value={totalTasks} 
          color="bg-blue-500"
        />
        <StatCard 
          title="In Progress" 
          value={inProgressTasks} 
          color="bg-green-500"
        />
        <StatCard 
          title="Under Review" 
          value={pendingReviewTasks} 
          color="bg-yellow-500"
        />
        <StatCard 
          title="Completed" 
          value={completedTasks} 
          color="bg-emerald-500"
        />
      </div>

      {/* Task Board - Mobile Responsive with gap-2 on mobile, gap-3 on larger screens */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        {taskStatus.map((status) => (
          <TaskColumn
            key={status}
            status={status}
            tasks={tasks?.filter((task) => task.status === status) || []}
            onTaskClick={handleTaskClick}
          />
        ))}
      </div>

      {/* Task Detail Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} name="Task Details">
        {selectedTask && <TaskDetailView task={selectedTask} />}
      </Modal>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  color: string;
}

const StatCard = ({ title, value, color }: StatCardProps) => (
  <div className="rounded-lg bg-white p-3 shadow dark:bg-dark-secondary sm:p-4">
    <div className="flex items-center gap-2">
      <div className={`h-8 w-1 rounded-full ${color}`} />
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-xl font-bold text-gray-800 dark:text-white sm:text-2xl">{value}</p>
      </div>
    </div>
  </div>
);

interface TaskColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const TaskColumn = ({ status, tasks, onTaskClick }: TaskColumnProps) => {
  const { color, icon } = statusConfig[status];
  
  return (
    <div className="flex flex-col">
      {/* Column Header */}
      <div className="mb-3 flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow dark:bg-dark-secondary sm:px-4 sm:py-3">
        <div className="flex items-center gap-2">
          <div style={{ color }}>{icon}</div>
          <h3 className="text-sm font-semibold dark:text-white sm:text-base">{status}</h3>
        </div>
        <span 
          className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-xs font-medium dark:bg-dark-tertiary dark:text-white sm:h-6 sm:w-6"
        >
          {tasks.length}
        </span>
      </div>

      {/* Task Cards - min-w-[200px] on mobile, min-w-[260px] on larger screens */}
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <MissionTaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
        ))}
      </div>
    </div>
  );
};

interface MissionTaskCardProps {
  task: Task;
  onClick: () => void;
}

const MissionTaskCard = ({ task, onClick }: MissionTaskCardProps) => {
  const formattedDueDate = task.dueDate
    ? format(new Date(task.dueDate), "MMM d")
    : null;

  const priorityColors: Record<string, string> = {
    Urgent: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
    High: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200",
    Medium: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
    Low: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
  };

  const numberOfComments = task.comments?.length || 0;

  return (
    <div
      onClick={onClick}
      className="min-w-[200px] cursor-pointer rounded-lg bg-white p-3 shadow transition-all hover:shadow-md dark:bg-dark-secondary sm:min-w-[260px]"
    >
      {/* Priority Tag */}
      {task.priority && (
        <span className={`mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[task.priority] || "bg-gray-100 text-gray-700"}`}>
          {task.priority}
        </span>
      )}

      {/* Title */}
      <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">
        {task.title}
      </h4>

      {/* Tags */}
      {task.tags && (
        <div className="mb-2 flex flex-wrap gap-1">
          {task.tags.split(",").map((tag) => (
            <span key={tag} className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600 dark:bg-blue-900 dark:text-blue-200">
              {tag.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {task.assignee && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {task.assignee.username}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {formattedDueDate && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="h-3 w-3" />
              {formattedDueDate}
            </div>
          )}
          {numberOfComments > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <MessageSquareMore className="h-3 w-3" />
              {numberOfComments}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface TaskDetailViewProps {
  task: Task;
}

const TaskDetailView = ({ task }: TaskDetailViewProps) => {
  const formattedStartDate = task.startDate
    ? format(new Date(task.startDate), "PPP")
    : "Not set";
  
  const formattedDueDate = task.dueDate
    ? format(new Date(task.dueDate), "PPP")
    : "Not set";

  const priorityColors: Record<string, string> = {
    Urgent: "text-red-600 bg-red-50 dark:bg-red-900 dark:text-red-200",
    High: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900 dark:text-yellow-200",
    Medium: "text-green-600 bg-green-50 dark:bg-green-900 dark:text-green-200",
    Low: "text-blue-600 bg-blue-50 dark:bg-blue-900 dark:text-blue-200",
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto p-4">
      {/* Header */}
      <div className="mb-4">
        <div className="mb-2 flex items-center gap-2">
          {task.priority && (
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>
          )}
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            {task.status}
          </span>
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">{task.title}</h2>
      </div>

      {/* Description */}
      <div className="mb-4">
        <h3 className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Description</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {task.description || "No description provided."}
        </p>
      </div>

      {/* Details Grid */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <h3 className="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">Start Date</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">{formattedStartDate}</p>
        </div>
        <div>
          <h3 className="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">Due Date</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">{formattedDueDate}</p>
        </div>
        <div>
          <h3 className="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">Assignee</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {task.assignee?.username || "Unassigned"}
          </p>
        </div>
        <div>
          <h3 className="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">Author</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {task.author?.username || "Unknown"}
          </p>
        </div>
      </div>

      {/* Tags */}
      {task.tags && (
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {task.tags.split(",").map((tag) => (
              <span key={tag} className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                {tag.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      {task.comments && task.comments.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Comments ({task.comments.length})
          </h3>
          <div className="space-y-2">
            {task.comments.map((comment) => (
              <div key={comment.id} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                <p className="text-sm text-gray-600 dark:text-gray-400">{comment.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MissionControlPage;
