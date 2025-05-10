import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import Terminal from "../components/Terminal";

const Dashboard = () => {
  const [sessionId, setSessionId] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Generate or retrieve session ID
    let currentSessionId = localStorage.getItem("terminal_session_id");
    if (!currentSessionId) {
      currentSessionId = uuidv4();
      localStorage.setItem("terminal_session_id", currentSessionId);
    }
    setSessionId(currentSessionId);
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const resetSession = () => {
    const newSessionId = uuidv4();
    localStorage.setItem("terminal_session_id", newSessionId);
    setSessionId(newSessionId);
  };

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? "fixed inset-0 z-50 bg-black" : "py-8"}`}>
      <div
        className={`mx-auto ${
          isFullscreen ? "h-full w-full" : "max-w-7xl px-4 sm:px-6 lg:px-8"
        }`}
      >
        {!isFullscreen && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Terminal Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Your secure terminal session is running. Use the controls below to
              manage your session.
            </p>
          </div>
        )}

        <div
          className={`terminal-container ${
            isFullscreen ? "h-full" : "h-[70vh]"
          } overflow-hidden flex flex-col`}
        >
          <div
            className={`${isFullscreen ? "p-0" : "p-0"} h-full flex flex-col`}
          >
            <Terminal sessionId={sessionId} />
          </div>
        </div>

        {!isFullscreen && (
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={toggleFullscreen}
              className="btn btn-secondary flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                />
              </svg>
              Fullscreen
            </button>
            <button
              onClick={resetSession}
              className="btn bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Reset Terminal
            </button>
          </div>
        )}

        {isFullscreen && (
          <button
            onClick={toggleFullscreen}
            className="fixed top-4 right-4 z-50 btn bg-gray-800 text-white px-2 py-1 rounded-md hover:bg-gray-700 flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Exit Fullscreen
          </button>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
