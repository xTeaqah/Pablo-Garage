import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <header className="px-5 pt-6 pb-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          {subtitle && (
            <p className="text-sm text-garage-400 mb-0.5">{subtitle}</p>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {title}
          </h1>
        </div>
        {children}
      </div>
    </header>
  );
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
}

export function Card({ children, className, onClick }: CardProps) {
  const Component = onClick ? "button" : "div";
  return (
    <Component
      onClick={onClick}
      className={cn(
        "glass-card rounded-2xl p-4 w-full text-left transition-all",
        onClick && "active:scale-[0.98] hover:border-garage-600",
        className
      )}
    >
      {children}
    </Component>
  );
}

interface StatTileProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  accent?: boolean;
}

export function StatTile({ label, value, icon, accent }: StatTileProps) {
  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-4 flex flex-col gap-2",
        accent && "border-amber-brand/30 bg-amber-brand/5"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-garage-400 uppercase tracking-wider">
          {label}
        </span>
        {icon && <span className="text-amber-brand">{icon}</span>}
      </div>
      <span className="text-xl font-bold text-white">{value}</span>
    </div>
  );
}

interface SectionTitleProps {
  title: string;
  action?: React.ReactNode;
}

export function SectionTitle({ title, action }: SectionTitleProps) {
  return (
    <div className="flex items-center justify-between mb-3 px-1">
      <h2 className="text-sm font-semibold text-garage-300 uppercase tracking-wider">
        {title}
      </h2>
      {action}
    </div>
  );
}

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const statusStyles: Record<string, string> = {
  SCHEDULED: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  IN_PROGRESS: "bg-amber-brand/15 text-amber-brand-light border-amber-brand/30",
  WAITING_PARTS: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  COMPLETE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  INVOICED: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  PAID: "bg-garage-600/50 text-garage-300 border-garage-500/30",
  CANCELLED: "bg-red-500/15 text-red-400 border-red-500/30",
  DRAFT: "bg-garage-600/50 text-garage-300 border-garage-500/30",
  SENT: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  OVERDUE: "bg-red-500/15 text-red-400 border-red-500/30",
  IN_STOCK: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  SOLD: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const labels: Record<string, string> = {
    SCHEDULED: "Scheduled",
    IN_PROGRESS: "In Progress",
    WAITING_PARTS: "Waiting Parts",
    COMPLETE: "Complete",
    INVOICED: "Invoiced",
    PAID: "Paid",
    CANCELLED: "Cancelled",
    DRAFT: "Draft",
    SENT: "Sent",
    OVERDUE: "Overdue",
    IN_STOCK: "In Stock",
    SOLD: "Sold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium border rounded-full",
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1",
        statusStyles[status] || "bg-garage-600/50 text-garage-300"
      )}
    >
      {labels[status] || status}
    </span>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
        fullWidth && "w-full",
        size === "sm" && "px-3 py-2 text-sm",
        size === "md" && "px-4 py-3 text-sm",
        size === "lg" && "px-6 py-4 text-base",
        variant === "primary" && "gradient-brand text-garage-950 shadow-lg shadow-amber-brand/20",
        variant === "secondary" && "bg-garage-700 text-garage-100 border border-garage-600 hover:bg-garage-600",
        variant === "ghost" && "text-garage-300 hover:text-white hover:bg-garage-800",
        variant === "danger" && "bg-red-500/15 text-red-400 border border-red-500/30",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-garage-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full bg-garage-900 border border-garage-700 rounded-xl px-4 py-3 text-white placeholder:text-garage-500 focus:border-amber-brand/50 focus:ring-1 focus:ring-amber-brand/30 transition-colors",
          error && "border-red-500",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className, ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-garage-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          "w-full bg-garage-900 border border-garage-700 rounded-xl px-4 py-3 text-white placeholder:text-garage-500 focus:border-amber-brand/50 focus:ring-1 focus:ring-amber-brand/30 transition-colors resize-none",
          className
        )}
        {...props}
      />
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-garage-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        className={cn(
          "w-full bg-garage-900 border border-garage-700 rounded-xl px-4 py-3 text-white focus:border-amber-brand/50 focus:ring-1 focus:ring-amber-brand/30 transition-colors appearance-none",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-garage-800 flex items-center justify-center text-garage-500 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-garage-200 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-garage-400 mb-4 max-w-xs">{description}</p>
      )}
      {action}
    </div>
  );
}
