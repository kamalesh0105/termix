import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

const Termix = () => {
  const terminalContainerRef = useRef(null);

  useEffect(() => {
    const term = new Terminal({
      rows: 20,
      cols: 80,
      cursorBlink: true,
    });
    term.open(terminalContainerRef.current);

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    fitAddon.fit();

    window.addEventListener("resize", () => fitAddon.fit());

    term.writeln("Welcome to xterm.js in React!");

    return () => {
      term.dispose();
      window.removeEventListener("resize", () => fitAddon.fit());
    };
  }, []);

  return (
    <div
      ref={terminalContainerRef}
      style={{ width: "100%", height: "400px" }}
    />
  );
};

export default Termix;
