import { useEffect, useState } from "react";

export const AIController = (props: any) => {
  const [agentPrompt, setAgentPrompt] = useState("");

  const handlePromptChange = (e: any) => {
    setAgentPrompt(e.target.value);
  }

  const defaultStatus = {
    prompt: "",
    status: "idle",
  };
  const [promptStatus, setPromptStatus] = useState(defaultStatus);
  const submitPrompt = () => {
    console.log(agentPrompt);
    setPromptStatus({ prompt: agentPrompt, status: "loading" });
  }

  const maxLoaderCount = 4;
  const [loaderCount, setLoaderCount] = useState(0);
  const loader = () => {
    setLoaderCount((loaderCount + 1) % maxLoaderCount);
  }
  useEffect(() => {
    if (promptStatus.status === "loading") {
      const interval = setInterval(loader, 500);
      return () => clearInterval(interval);
    }
  }, [promptStatus.status, loaderCount]);

  return (
    <div
      className="Buttonlike__primary pl-[1rem] pr-[0.5rem] gap-2 w-[50rem]"
    >
      {promptStatus.status === "idle" && (
        <input
          className="w-[50rem] m-[0.5rem] Input__primary Text__small"
          type="text"
          value={agentPrompt}
          onChange={handlePromptChange}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              submitPrompt();
            }
          }}
          placeholder="Please enter a prompt..."
        />
      )}
      {promptStatus.status === "loading" && (
        <div className="Text__small flex-grow">Thinking{".".repeat(loaderCount)}</div>
      )}
      <div
        className="Button__close"
        onClick={() => props.setSelectedBotOption(null)}
      >
        x
      </div>
    </div>
  );
}
