import { lazy } from "react";

function NotBuilt() {
  return <p style={{ padding: 24 }}>This page has not been built yet.</p>;
}

export default function lazyPage(loader) {
  return lazy(() =>
    loader().then((module) => (module.default ? module : { default: NotBuilt }))
  );
}