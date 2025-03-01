
interface ErrorDisplayProps {
  error: string | null;
}

export const ErrorDisplay = ({ error }: ErrorDisplayProps) => {
  if (!error) return null;
  
  return (
    <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md mb-4">
      <p className="font-medium">Error loading users</p>
      <p className="text-sm">{error}</p>
      <p className="text-sm mt-2">
        Make sure you have admin privileges to access this page.
      </p>
    </div>
  );
};
