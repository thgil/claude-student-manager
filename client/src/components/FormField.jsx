export default function FormField({
  label,
  type = 'text',
  value,
  onChange,
  required = false,
  error,
  id,
  ...props
}) {
  const fieldId = id || label?.toLowerCase().replace(/\s+/g, '-')

  const inputClasses = `w-full border rounded-md px-3 py-2 ${error ? 'border-red-500' : ''}`

  return (
    <div>
      {label && (
        <label
          htmlFor={fieldId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}{required && ' *'}
        </label>
      )}
      {type === 'textarea' ? (
        <textarea
          id={fieldId}
          value={value}
          onChange={onChange}
          className={inputClasses}
          required={required}
          aria-required={required}
          {...props}
        />
      ) : type === 'select' ? (
        <select
          id={fieldId}
          value={value}
          onChange={onChange}
          className={inputClasses}
          required={required}
          aria-required={required}
          {...props}
        />
      ) : (
        <input
          id={fieldId}
          type={type}
          value={value}
          onChange={onChange}
          className={inputClasses}
          required={required}
          aria-required={required}
          {...props}
        />
      )}
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  )
}
