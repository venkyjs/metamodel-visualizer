export interface NodeData extends Record<string, unknown> {
  label: string;
  isExpanded?: boolean;
  isLoading?: boolean;
  parentId?: string | null;
  level?: number;
}

export interface ApiError {
  message: string;
  code?: number;
}

