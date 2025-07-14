import { useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import io from "socket.io-client";
import "xterm/css/xterm.css";

const Terminal = ({ sessionId }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const socketRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize terminal
    xtermRef.current = new XTerm({
      cursorBlink: true,
      fontFamily: "JetBrains Mono, Consolas, monospace",
      fontSize: 14,
      convertEol: true,
      theme: {
        background: "#1a1a1a",
        foreground: "#f0f0f0",
        cursor: "#f0f0f0",
        selectionBackground: "rgba(255, 255, 255, 0.3)",
        black: "#000000",
        red: "#e06c75",
        green: "#98c379",
        yellow: "#e5c07b",
        blue: "#61afef",
        magenta: "#c678dd",
        cyan: "#56b6c2",
        white: "#abb2bf",
        brightBlack: "#5c6370",
        brightRed: "#e06c75",
        brightGreen: "#98c379",
        brightYellow: "#e5c07b",
        brightBlue: "#61afef",
        brightMagenta: "#c678dd",
        brightCyan: "#56b6c2",
        brightWhite: "#ffffff",
      },
    });

    fitAddonRef.current = new FitAddon();
    xtermRef.current.loadAddon(fitAddonRef.current);

   
    xtermRef.current.loadAddon(new WebLinksAddon());

    xtermRef.current.open(terminalRef.current);

    socketRef.current = io("http://localhost:3001", {
      transports: ["websocket"],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
      socketRef.current.emit("create-session", { sessionId });
    });

    socketRef.current.on("session-created", () => {
      console.log("Session created");
      setIsLoading(false);
      setIsInitialized(true);

      if (xtermRef.current) {
        xtermRef.current.clear();
        
        setTimeout(() => {
          if (xtermRef.current) {
            xtermRef.current.focus();
         
            if (fitAddonRef.current) {
              fitAddonRef.current.fit();
            }
          }
        }, 100);
      }
    });

    socketRef.current.on("terminal-output", (data) => {
      if (xtermRef.current) {
        xtermRef.current.write(data);
      }
    });

    socketRef.current.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
      if (xtermRef.current) {
        xtermRef.current.write(
          "\r\n\x1b[1;31mDisconnected from server. Trying to reconnect...\x1b[0m\r\n"
        );
      }
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      if (xtermRef.current) {
        xtermRef.current.write(
          `\r\n\x1b[1;31mConnection error: ${err.message}\x1b[0m\r\n`
        );
      }
    });
    xtermRef.current.onData((data) => {
      if (isConnected && !isLoading && socketRef.current && isInitialized) {
        socketRef.current.emit("terminal-input", { sessionId, data });
      }
    });

    
    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current) {
        fitAddonRef.current.fit();
        if (isConnected && !isLoading && socketRef.current) {
          const dimensions = {
            cols: xtermRef.current.cols,
            rows: xtermRef.current.rows,
          };
          socketRef.current.emit("terminal-resize", { sessionId, dimensions });
        }
      }
    };

    window.addEventListener("resize", handleResize);
    
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);

      if (socketRef.current) {
        socketRef.current.emit("end-session", { sessionId });
        socketRef.current.disconnect();
      }

      if (xtermRef.current) {
        xtermRef.current.dispose();
      }
    };
  }, [sessionId]);

  const handleTerminalClick = () => {
    if (xtermRef.current && isInitialized) {
      xtermRef.current.focus();
    }
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="bg-gray-800 py-2 px-4 flex justify-between items-center">
        <div className="flex items-center">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="ml-4 text-gray-300 text-sm flex items-center">
            <span>terminal@web</span>
            <span className="ml-2 w-2 h-2 rounded-full bg-green-500"></span>
          </div>
        </div>
        <div className="text-gray-300 text-xs">
          {isConnected ? (
            <span className="text-green-400">Connected</span>
          ) : (
            <span className="text-red-400">Disconnected</span>
          )}
        </div>
      </div>
      <div
        ref={terminalRef}
        className="terminal-content flex-grow w-full bg-black cursor-text overflow-hidden p-2"
        style={{ height: "500px" }}
        onClick={handleTerminalClick}
      />
    </div>
  );
};

export default Terminal;
