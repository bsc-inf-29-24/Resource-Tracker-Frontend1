import type { ReactNode } from "react";
import styles from "./PageHeader.module.css";

interface PageHeaderProps {
  title: string;
  description?: string;
  supplementary?: ReactNode;
}

export default function PageHeader({
  title,
  description,
  supplementary,
}: PageHeaderProps) {
  const cleanDescription = description?.trim();

  return (
    <header className={styles.header}>
      <div className={styles.text}>
        <h1 className={styles.title}>{title}</h1>
        {cleanDescription && (
          <p className={styles.description}>{cleanDescription}</p>
        )}
      </div>
      {supplementary && (
        <div className={styles.supplementary}>{supplementary}</div>
      )}
    </header>
  );
}
