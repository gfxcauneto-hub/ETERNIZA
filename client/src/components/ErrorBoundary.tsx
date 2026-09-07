import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#050505", color: "#fff", textAlign: "center" }}>
        <div>
          <div aria-hidden="true" style={{ fontSize: 40 }}>!</div>
          <h1 style={{ fontSize: 21, margin: "12px 0 8px" }}>Não foi possível carregar esta página.</h1>
          <p style={{ color: "rgba(255,255,255,.68)", margin: "0 0 18px" }}>Atualize para tentar novamente.</p>
          <button type="button" onClick={() => window.location.reload()} style={{ border: 0, borderRadius: 12, padding: "12px 18px", fontWeight: 800, cursor: "pointer" }}>Atualizar página</button>
        </div>
      </main>
    );
  }
}

export default ErrorBoundary;
