/** Помилка у формі — червона, з іконкою, помітно відрізняється від успішних плашок */
export default function FormError({ children }: { children: React.ReactNode }) {
  if (!children) return null;

  return (
    <div className="form-error" role="alert">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v5" />
        <path d="M12 16.2v.1" />
      </svg>
      <span>{children}</span>
    </div>
  );
}
