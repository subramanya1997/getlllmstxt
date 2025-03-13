interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status?.toLowerCase()) {
    case 'queued':
      return <span className="text-blue-500">Queued</span>;
    case 'processing':
      return <span className="text-amber-500">Processing</span>;
    case 'completed':
      return <span className="text-green-500">Completed</span>;
    case 'failed':
      return <span className="text-red-500">Failed</span>;
    default:
      return <span className="text-gray-500">{status || 'Unknown'}</span>;
  }
} 