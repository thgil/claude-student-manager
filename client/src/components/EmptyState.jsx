export default function EmptyState({
  message,
  action,
  onAction,
  className = ''
}) {
  return (
    <div className={`px-6 py-8 text-center text-gray-500 ${className}`}>
      <p>{message}</p>
      {action && onAction && (
        <button
          onClick={onAction}
          className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {action}
        </button>
      )}
    </div>
  )
}
