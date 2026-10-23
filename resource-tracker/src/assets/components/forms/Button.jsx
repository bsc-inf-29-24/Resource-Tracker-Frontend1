import { forwardRef } from "react";

/** variant: "primary" | "outline" | "danger"   pill: rounded pill style (dialogs) */
const Button = forwardRef(function Button(
  { variant = "primary", pill = false, type = "button", className = "", children, ...rest }, ref
) {
  const cls = ["rt-root", "rt-btn", `rt-btn--${variant}`, pill && "rt-btn--pill", className].filter(Boolean).join(" ");
  return <button ref={ref} type={type} className={cls} {...rest}>{children}</button>;
});
export default Button;
