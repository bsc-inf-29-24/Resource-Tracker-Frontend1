/** Primary / secondary / danger button used across every page. */
export default function Button({
  variant = 'primary',   // 'primary' | 'secondary' | 'danger'
  size = 'md',           // 'md' | 'lg'
  block = false,
  icon,                  // optional icon element placed before the label
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  const cls = [
    'rt-btn',
    `rt-btn--${variant}`,
    size === 'lg' && 'rt-btn--lg',
    block && 'rt-btn--block',
    className,
  ].filter(Boolean).join(' ');
  return (
    <button type={type} className={cls} {...rest}>
      {icon}
      {children}
    </button>
  );
}
